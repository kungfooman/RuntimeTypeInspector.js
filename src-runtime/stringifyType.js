import {isParameterNode} from './isParameterNode.js';
/**
 * @param {string} name - The property name.
 * @returns {string} Bare name if valid identifier, else JSON-quoted.
 */
function stringifyKey(name) {
  if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name)) {
    return name;
  }
  return JSON.stringify(name);
}
/**
 * @param {any} type - The type to stringify.
 * @param {number|null} space - Indentation size for multiline objects/tuples (0 = single line). Pass `null` as replacer like `JSON.stringify(data, null, 2)`.
 * @param {number} depth - Current nesting depth.
 * @returns {string} TypeScript-like string representation.
 */
function stringifyType(type, space = 0, depth = 0) {
  // Support JSON.stringify-style call: stringifyType(data, null, 2)
  if (space === null) {
    space = typeof depth === 'number' ? depth : 0;
    depth = 0;
  }
  if (type === undefined) {
    return 'undefined';
  }
  if (type === null) {
    return 'null';
  }
  if (typeof type === 'number' || typeof type === 'boolean') {
    return String(type);
  }
  if (typeof type === 'string') {
    return type;
  }
  if (typeof type !== 'object') {
    return String(type);
  }
  if (typeof type === 'object') {
    if (type.type === 'parameter') {
      const key = stringifyType(type.name, space, depth + 1);
      const val = stringifyType(type.paramType, space, depth + 1);
      return `${key}: ${val}`;
    }
    if (type.type === 'atom') {
      return stringifyType(type.atomType, space, depth + 1);
    }
  }
  const {type: kind} = type;
  // {type: 'string', optional: true} etc. where kind is a plain type name
  // and carries no extra structural fields - unwrap below after switch.
  let out;
  const stringifyNested = (nested) => stringifyType(nested, space, depth + 1);
  switch (kind) {
    case 'object': {
      const {properties, indexSignatures} = type;
      const pad = space ? ' '.repeat(space * (depth + 1)) : '';
      const padEnd = space ? ' '.repeat(space * depth) : '';
      const sep = space ? ',\n' + pad : ', ';
      const parts = [];
      if (properties) {
        for (const key of Object.keys(properties)) {
          const val = properties[key];
          const isOpt = !!(val && typeof val === 'object' && val.optional);
          const isReadonly = !!(val && typeof val === 'object' && val.readonly);
          const prefix = isReadonly ? 'readonly ' : '';
          if (isOpt) {
            const inner = {...val, optional: false};
            const innerStr = stringifyType(inner, space, depth + 1);
            parts.push(`${prefix}${stringifyKey(key)}?: ${innerStr}`);
          } else {
            parts.push(`${prefix}${stringifyKey(key)}: ${stringifyType(val, space, depth + 1)}`);
          }
        }
      }
      if (Array.isArray(indexSignatures)) {
        for (const sig of indexSignatures) {
          parts.push(stringifyType(sig, space, depth + 1));
        }
      }
      if (parts.length === 0) {
        out = 'object';
      } else if (space) {
        out = `{\n${pad}${parts.join(sep)}\n${padEnd}}`;
      } else {
        out = `{${parts.join(sep)}}`;
      }
      break;
    }
    case 'array': {
      const inner = stringifyType(type.elementType, space, depth + 1);
      // [] suffix ONLY for absolute simple one-keyword types (string, Node, MyEnum.FOO).
      // Everything else (unions, objects, nested arrays, literals) keeps Array<T>.
      const el = type.elementType;
      const simple = typeof el === 'string' && /^[A-Za-z_$][A-Za-z0-9_$.]*$/.test(el);
      out = simple ? `${inner}[]` : `Array<${inner}>`;
      break;
    }
    case 'tuple': {
      const {elements} = type;
      const stringifyEl = (el) => {
        if (el && typeof el === 'object' && el.type === 'tupleMember') {
          const inner = stringifyNested(el.elementType);
          if (el.dotDot) {
            return `...${el.name}: ${inner}`;
          }
          return `${el.name}${el.optional ? '?' : ''}: ${inner}`;
        }
        return stringifyNested(el);
      };
      if (space && elements.length > 3) {
        const pad = ' '.repeat(space * (depth + 1));
        const padEnd = ' '.repeat(space * depth);
        out = `[\n${pad}${elements.map(stringifyEl).join(',\n' + pad)}\n${padEnd}]`;
      } else {
        out = `[${elements.map(stringifyEl).join(', ')}]`;
      }
      break;
    }
    case 'tupleMember': {
      const inner = stringifyNested(type.elementType);
      if (type.dotDot) {
        return `...${type.name}: ${inner}`;
      }
      return `${type.name}${type.optional ? '?' : ''}: ${inner}`;
    }
    case 'union':
      out = type.members.map(stringifyNested).join(' | ');
      break;
    case 'intersection':
      out = type.members.map(stringifyNested).join(' & ');
      break;
    case 'record':
      out = `Record<${stringifyNested(type.key)}, ${stringifyNested(type.val)}>`;
      break;
    case 'map':
      out = `Map<${stringifyNested(type.key)}, ${stringifyNested(type.val)}>`;
      break;
    case 'set':
      out = `Set<${stringifyNested(type.elementType)}>`;
      break;
    case 'promise':
      out = `Promise<${stringifyNested(type.elementType)}>`;
      break;
    case 'class':
      out = `Class<${stringifyNested(type.elementType)}>`;
      break;
    case 'rest':
      out = `...${stringifyNested(type.annotation)}`;
      break;
    case 'keyof':
      out = `keyof ${stringifyNested(type.argument)}`;
      break;
    case 'typeof':
      out = `typeof ${stringifyNested(type.argument)}`;
      break;
    case 'indexedAccess':
      out = `${stringifyNested(type.object)}[${stringifyNested(type.index)}]`;
      break;
    case 'mapping': {
      const iterable = stringifyNested(type.iterable);
      const element = stringifyNested(type.element);
      const result = stringifyNested(type.result);
      let readonly = '';
      if (type.readonly === '-') {
        readonly = '-readonly ';
      } else if (type.readonly === '+' || type.readonly === 'readonly') {
        readonly = type.readonly === '+' ? '+readonly ' : 'readonly ';
      }
      let question = '';
      if (type.question === '-' || type.question === '+') {
        question = type.question + '?';
      } else if (type.question === '?') {
        question = '?';
      }
      if (type.nameType !== undefined) {
        const renamed = stringifyNested(type.nameType);
        return `{${readonly}[${element} in ${iterable} as ${renamed}]${question}: ${result}}`;
      }
      return `{${readonly}[${element} in ${iterable}]${question}: ${result}}`;
    }
    case 'function': {
      const params = (type.parameters || []).map(stringifyNested).join(', ');
      const ret = type.ret ? stringifyNested(type.ret) : 'any';
      out = `(${params})=>${ret}`;
      break;
    }
    case 'new': {
      const params = (type.parameters || []).map(stringifyNested).join(', ');
      const ret = type.ret ? stringifyNested(type.ret) : 'any';
      out = `new(${params})=>${ret}`;
      break;
    }
    case 'condition': {
      const check = stringifyNested(type.checkType);
      const base = stringifyNested(type.extendsType);
      const yes = stringifyNested(type.trueType);
      const no = stringifyNested(type.falseType);
      out = `${check} extends ${base}?${yes}:${no}`;
      break;
    }
    case 'reference': {
      const args = (type.args || []).map(stringifyNested).join(', ');
      out = args ? `${type.name}<${args}>` : type.name;
      break;
    }
    case 'templateLiteral': {
      const {quasis, types} = type;
      let str = '`';
      str += quasis[0];
      for (let i = 0; i < types.length; i++) {
        str += `\${${stringifyNested(types[i])}}${quasis[i + 1]}`;
      }
      str += '`';
      out = str;
      break;
    }
    case 'indexSignature': {
      const stringifyIndexParam = (param) => {
        if (isParameterNode(param)) {
          const key = stringifyNested(param.name);
          const val = stringifyNested(param.paramType);
          return `${key}: ${val}`;
        }
        return stringifyNested(param);
      };
      const params = (type.indexParameters || []).map(stringifyIndexParam).join(', ');
      out = `[${params}]: ${stringifyNested(type.indexType)}`;
      break;
    }
    case 'bigint':
      out = type.literal !== undefined ? `${type.literal}n` : 'bigint';
      break;
    default:
      if (typeof kind === 'number' || typeof kind === 'boolean') {
        out = String(kind);
      } else if (typeof kind === 'string') {
        out = kind;
      } else {
        out = String(kind);
      }
      break;
  }
  if (type.optional) {
    out = `(${out})|undefined`;
  }
  return out;
}
export {stringifyType};
