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
  const {type: kind} = type;
  // {type: 'string', optional: true} etc. where kind is a plain type name
  // and carries no extra structural fields - unwrap below after switch.
  let out;
  switch (kind) {
    case 'object': {
      const {properties, indexSignatures} = type;
      const pad = space ? ' '.repeat(space * (depth + 1)) : '';
      const padEnd = space ? ' '.repeat(space * depth) : '';
      const sep = space ? ',\n' + pad : ', ';
      const parts = [];
      if (properties) {
        for (const key of Object.keys(properties)) {
          parts.push(`${stringifyKey(key)}: ${stringifyType(properties[key], space, depth + 1)}`);
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
        out = `{ ${parts.join(sep)} }`;
      }
      break;
    }
    case 'array':
      out = `Array<${stringifyType(type.elementType, space, depth + 1)}>`;
      break;
    case 'tuple': {
      const {elements} = type;
      if (space && elements.length > 3) {
        const pad = ' '.repeat(space * (depth + 1));
        const padEnd = ' '.repeat(space * depth);
        out = `[\n${pad}${elements.map((_) => stringifyType(_, space, depth + 1)).join(',\n' + pad)}\n${padEnd}]`;
      } else {
        out = `[${elements.map((_) => stringifyType(_, space, depth + 1)).join(', ')}]`;
      }
      break;
    }
    case 'union':
      out = type.members.map((_) => stringifyType(_, space, depth + 1)).join(' | ');
      break;
    case 'intersection':
      out = type.members.map((_) => stringifyType(_, space, depth + 1)).join(' & ');
      break;
    case 'record':
      out = `Record<${stringifyType(type.key, space, depth + 1)}, ${stringifyType(type.val, space, depth + 1)}>`;
      break;
    case 'map':
      out = `Map<${stringifyType(type.key, space, depth + 1)}, ${stringifyType(type.val, space, depth + 1)}>`;
      break;
    case 'set':
      out = `Set<${stringifyType(type.elementType, space, depth + 1)}>`;
      break;
    case 'promise':
      out = `Promise<${stringifyType(type.elementType, space, depth + 1)}>`;
      break;
    case 'class':
      out = `Class<${stringifyType(type.elementType, space, depth + 1)}>`;
      break;
    case 'rest':
      out = `...${stringifyType(type.annotation, space, depth + 1)}`;
      break;
    case 'keyof':
      out = `keyof ${stringifyType(type.argument, space, depth + 1)}`;
      break;
    case 'typeof':
      out = `typeof ${stringifyType(type.argument, space, depth + 1)}`;
      break;
    case 'indexedAccess':
      out = `${stringifyType(type.object, space, depth + 1)}[${stringifyType(type.index, space, depth + 1)}]`;
      break;
    case 'mapping':
      out = `{ [${stringifyType(type.element, space, depth + 1)} in ${stringifyType(type.iterable, space, depth + 1)}]: ${stringifyType(type.result, space, depth + 1)} }`;
      break;
    case 'function': {
      const params = (type.parameters || []).map((_) => stringifyType(_, space, depth + 1)).join(', ');
      out = `(${params}) => any`;
      break;
    }
    case 'new': {
      const params = (type.parameters || []).map((_) => stringifyType(_, space, depth + 1)).join(', ');
      const ret = type.ret ? stringifyType(type.ret, space, depth + 1) : 'any';
      out = `new (${params}) => ${ret}`;
      break;
    }
    case 'condition':
      out = `${stringifyType(type.checkType, space, depth + 1)} extends ${stringifyType(type.extendsType, space, depth + 1)} ? ${stringifyType(type.trueType, space, depth + 1)} : ${stringifyType(type.falseType, space, depth + 1)}`;
      break;
    case 'reference': {
      const args = (type.args || []).map((_) => stringifyType(_, space, depth + 1)).join(', ');
      out = args ? `${type.name}<${args}>` : type.name;
      break;
    }
    case 'templateLiteral': {
      const {quasis, types} = type;
      let str = '`';
      str += quasis[0];
      for (let i = 0; i < types.length; i++) {
        str += `\${${stringifyType(types[i], space, depth + 1)}}${quasis[i + 1]}`;
      }
      str += '`';
      out = str;
      break;
    }
    case 'indexSignature': {
      // {type: 'indexSignature', indexType, indexParameters: [{type, name}]}
      const params = (type.indexParameters || []).map((_) => {
        if (typeof _ === 'object' && _.name !== undefined) {
          return `${stringifyType(_.name, space, depth + 1)}: ${stringifyType(_.type, space, depth + 1)}`;
        }
        return stringifyType(_, space, depth + 1);
      }).join(', ');
      out = `[${params}]: ${stringifyType(type.indexType, space, depth + 1)}`;
      break;
    }
    case 'bigint':
      out = type.literal !== undefined ? `${type.literal}n` : 'bigint';
      break;
    default:
      // Plain named type like 'string', 'number', "'aa'", 'MyClass', or
      // TypeObject wrappers like {type: 'string', optional: true}.
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
    out = `(${out}) | undefined`;
  }
  return out;
}
export {stringifyType};
