import {parse} from '@babel/parser';
import {isExpandedObject} from './isExpandedObject.js';
import {isIndexSignatureNode} from './isIndexSignatureNode.js';
/** @import {ExpandedType, ExpandParameterNode, ExpandTupleMemberNode, ExpandMappingNode, ExpandIndexSignatureNode, ExpandObjectNode} from './expandedType.js' */
/**
 * @todo Better handling of weird case: Array<>
 * @example
 * const {expandTypeBabelTS} = await import("./src-transpiler/expandTypeBabelTS.js");
 * expandTypeBabelTS('[string, Array|AnyTypedArray, number[]]|[ONNXTensor]');
 * expandTypeBabelTS('(123)                    '); // Outputs: '123'
 * expandTypeBabelTS('  ( ( 123 ) )            '); // Outputs: '123'
 * expandTypeBabelTS('Array<number>            '); // Outputs: {type: 'array', elementType: 'number'}
 * expandTypeBabelTS('Array<(123) >            '); // Outputs: {type: 'array', elementType: '123'}
 * expandTypeBabelTS('Array<"abc" | 123>       '); // Outputs: {type: 'array', elementType: {type: 'union', members: ['"abc"', '123']}}
 * expandTypeBabelTS('  (string ) |(number )   '); // Outputs: {type: 'union', members: [ 'string', 'number']}
 * expandTypeBabelTS(' "apples" | ( "bananas") '); // Outputs: {type: 'union', members: [ '"apples"', '"bananas"']}
 * expandTypeBabelTS('123?                     '); // Outputs: {type: 'union', members: ['123', 'null']}
 * expandTypeBabelTS('123|null                 '); // Outputs: {type: 'union', members: ['123', 'null']}
 * expandTypeBabelTS('Map<string, any>         '); // Outputs: {type: 'map', key: 'string', val: 'any'}
 * expandTypeBabelTS("(a: number, b: number) => number")
 * @param {string} type - The input type.
 * @returns {ExpandedType | undefined} - See `toSourceBabelTS`.
 */
function expandTypeBabelTS(type) {
  type = type.trim();
  // JSDoc `*`: Babel has no JSDocAllType support, handle at string level
  // to match expandType(), which keeps the raw `*` keyword.
  if (type === '*') {
    return '*';
  }
  // JSDocNullableType (`T?` / `?T`): Babel has no support (babel/babel#16073),
  // handle at string level to match expandType() union-with-null.
  if (type.endsWith('?') && type.length > 1) {
    const inner = expandTypeBabelTS(type.slice(0, -1).trim());
    if (inner === undefined) {
      return undefined;
    }
    return ({type: 'union', members: [inner, 'null']});
  }
  if (type.startsWith('?') && type.length > 1) {
    const inner = expandTypeBabelTS(type.slice(1).trim());
    if (inner === undefined) {
      return undefined;
    }
    return ({type: 'union', members: [inner, 'null']});
  }
  const ast = parseTypeBabelTS(type);
  return toSourceBabelTS(ast);
}
/**
 * @param {string} str - The type string.
 * @returns {*} - The Babel type annotation node for the alias.
 */
function parseTypeBabelTS(str) {
  // TS doesn't like ... notation in this context
  //if (str.startsWith('...')) {
  //  str = str.slice(3); // remove dots
  //  str += '[]'; // turn into array
  //}
  // type tmp = (...string) => 123; to have a function context
  str = `type tmp = ${str};`;
  const ast = parse(str, {plugins: ['typescript']});
  const first = ast.program.body[0];
  // Input is always the synthesized `type tmp = ...` alias above.
  if (first.type !== 'TSTypeAliasDeclaration') {
    throw Error('parseTypeBabelTS> expected synthesized type alias, got ' + first.type);
  }
  return first.typeAnnotation;
}
/**
 * Converts a Babel function parameter to a `{type, name}` parameter node,
 * matching the TS parser's `Parameter` case. `RestElement` (`...args: T[]`)
 * wraps like `dotDotDotToken` does there, producing an array node instead
 * of a parameter node, exactly like the TS parser.
 * @param {*} param - The Babel parameter node.
 * @returns {ExpandedType} The parameter or rest-array node.
 */
function toBabelParameter(param) {
  if (param && param.type === 'RestElement') {
    const type = toSourceBabelTSOrAny(param.typeAnnotation?.typeAnnotation);
    const name = param.argument?.name ?? 'args';
    /** @type {ExpandParameterNode} */
    const inner = {type, name};
    return ({type: 'array', elementType: inner});
  }
  const type = toSourceBabelTSOrAny(param?.typeAnnotation?.typeAnnotation);
  const name = param?.name ?? 'arg';
  return ({type, name});
}
/**
 * Converts a Babel index signature parameter (`[n: number]`) to a
 * `{type, name}` parameter node, matching the TS parser's `Parameter`
 * case without the rest wrapping.
 * @param {*} param - The Babel parameter node.
 * @returns {ExpandParameterNode} The parameter node.
 */
function toBabelIndexParameter(param) {
  const type = toSourceBabelTSOrAny(param?.typeAnnotation?.typeAnnotation);
  const name = param?.name ?? 'arg';
  return {type, name};
}
/**
 * Expands a Babel index signature parameter, defaulting unrepresentable
 * results to `any`, matching the `OrAny` policy of the other slots.
 * @param {*} param - The Babel index signature parameter node.
 * @returns {ExpandParameterNode} The parameter node.
 */
function toBabelIndexParameterOrAny(param) {
  return toBabelIndexParameter(param) ?? 'any';
}
/**
 * Reads the cooked text of a Babel template element.
 * @param {*} quasi - The template element node.
 * @returns {string} The cooked text.
 */
function cookedQuasi(quasi) {
  return quasi.value.cooked ?? quasi.value.raw;
}
/**
 * Expands a Babel node, defaulting unrepresentable results to `any`.
 * Every inner slot of every node shape uses this instead of a bare
 * `toSourceBabelTS` call, so no `undefined` ever lands in a shape: tsc
 * reads unknown JSDoc parts as `any` too (notably `?`), and the runtime
 * validates `any` without crashing.
 * Degenerate empty fragments (from `?` operands) become `any` here too.
 * @param {*} node - The Babel AST node to convert.
 * @returns {ExpandedType} The expansion, or `any` when unrepresentable.
 */
function toSourceBabelTSOrAny(node) {
  const expanded = toSourceBabelTS(node);
  return expanded === undefined || expanded === '' ? 'any' : expanded;
}
/**
 * Expands a Babel function parameter, defaulting unrepresentable results
 * to `any`. Function parameter slots use this instead of a bare
 * `toBabelParameter` call, matching the `OrAny` policy of the other slots.
 * @param {*} param - The Babel parameter node.
 * @returns {ExpandedType} The parameter node, rest-array node, or `any`.
 */
function toBabelParameterOrAny(param) {
  return toBabelParameter(param) ?? 'any';
}
/**
 * Converts a Babel AST node to its source string representation or structured type object.
 *
 * This function handles a variety of node types provided by Babel and converts them into a string
 * or an intermediate object representing the type, depending on the complexity of the type described by the node.
 *
 * @param {*} node - The Babel AST node to convert.
 * @returns {ExpandedType | undefined} - A string, object representing a structured type, or `undefined` for unhandled types.
 * Depending on the node, it may return a simple type string (e.g., `"string"` for `TSStringKeyword`),
 * a structured type object (e.g., a record type for `TSTypeReference` with type arguments),
 * or `undefined` if the encountered type is not handled. Unhandled types trigger a warning and enter a debugger statement.
 */
function toSourceBabelTS(node) {
  switch (node.type) {
    case 'TSBigIntKeyword':
      return {type: 'bigint'};
    case 'BigIntLiteral':
      const literal = node.value;
      return {type: 'bigint', literal};
    // expandTypeBabelTS("(a: number, b: number) => number")
    case 'TSFunctionType': {
      const parameters = node.parameters.map(toBabelParameterOrAny);
      return ({type: 'function', parameters});
    }
    case 'TSConstructorType': {
      const parameters = node.parameters.map(toBabelParameterOrAny);
      const ret = toSourceBabelTSOrAny(node.typeAnnotation?.typeAnnotation);
      return ({type: 'new', parameters, ret});
    }
    case 'TSTypeReference': {
      const name = toSourceBabelTS(node.typeName);
      if (!node.typeParameters) {
        // Bare `Object` is the empty object type, matching expandType().
        if (name === 'Object') {
          return {type: 'object', properties: {}};
        }
        // Bare reference: Identifier gives name, TSQualifiedName gives dotted path.
        return name;
      }
      console.assert(node.typeParameters.type === 'TSTypeParameterInstantiation');
      const typeArguments = node.typeParameters.params;
      if ((name === 'Object' || name === 'Record') && typeArguments?.length === 2) {
        const key = toSourceBabelTS(typeArguments[0]);
        const val = toSourceBabelTS(typeArguments[1]);
        if (key === undefined || val === undefined) {
          return undefined;
        }
        return ({
          type: 'record',
          key,
          val,
        });
      } else if (name === 'Object' && (!typeArguments || typeArguments?.length === 0)) {
        return {type: 'object', properties: {}};
      } else if (name === 'Map' && typeArguments?.length === 2) {
        const key = toSourceBabelTS(typeArguments[0]);
        const val = toSourceBabelTS(typeArguments[1]);
        if (key === undefined || val === undefined) {
          return undefined;
        }
        return ({type: 'map', key, val});
      } else if (name === 'Array' && typeArguments?.length === 1) {
        const elementType = toSourceBabelTS(typeArguments[0]);
        if (elementType === undefined) {
          return undefined;
        }
        return ({type: 'array', elementType});
      } else if (name === 'Promise' && typeArguments?.length === 1) {
        const elementType = toSourceBabelTS(typeArguments[0]);
        if (elementType === undefined) {
          return undefined;
        }
        return ({type: 'promise', elementType});
      } else if (name === 'Set' && typeArguments?.length === 1) {
        const elementType = toSourceBabelTS(typeArguments[0]);
        if (elementType === undefined) {
          return undefined;
        }
        return ({type: 'set', elementType});
      }
      // Parity with expandType(): generic references like ArrayLike<T>,
      // ReadonlyArray<T>, NodeListOf<T> or user typedefs like MyBox<T>.
      // Unrepresentable args become `any`, matching tsc leniency.
      const args = typeArguments.map(toSourceBabelTSOrAny);
      return ({type: 'reference', name, args});
    }
    case 'TSStringKeyword':
      return 'string';
    case 'TSSymbolKeyword':
      return 'symbol';
    case 'TSNumberKeyword':
      return 'number';
    case 'TSIntersectionType': {
      const members = node.types.map(toSourceBabelTSOrAny);
      return ({
        type: 'intersection',
        members
      });
    }
    case 'TSTupleType': {
      // Unnamed `?` elements (`[string, number?]`) become optional members
      // with an empty label, matching tsc and expandType().
      // Unrepresentable elements become `any`, matching tsc leniency.
      const elements = node.elementTypes.map(
        /**
         * @param {*} el - The Babel tuple element node.
         * @returns {ExpandedType} The element, an optional member, or `any`.
         */
        (el) => {
          if (el && el.type === 'TSOptionalType') {
            const inner = toSourceBabelTSOrAny(el.typeAnnotation);
            return {type: 'tupleMember', name: '', elementType: inner, optional: true};
          }
          return toSourceBabelTSOrAny(el);
        }
      );
      return ({
        type: 'tuple',
        elements
      });
    }
    case 'TSNamedTupleMember': {
      const nName = typeof node.label === 'string' ? node.label : node.label?.name;
      const nType = toSourceBabelTSOrAny(node.elementType);
      if (typeof nName !== 'string') {
        return undefined;
      }
      /** @type {ExpandTupleMemberNode} */
      const mem = {
        type: 'tupleMember',
        name: nName,
        elementType: nType,
      };
      if (node.optional) mem.optional = true;
      return mem;
    }
    case 'TSRestType': {
      const inner = node.typeAnnotation;
      // Named rest `...rest: number[]` arrives wrapped in a tuple member
      // carrying the label; convert like expandTypeDepFree does.
      if (inner && inner.type === 'TSNamedTupleMember') {
        const nName = typeof inner.label === 'string' ? inner.label : inner.label?.name;
        const nType = toSourceBabelTSOrAny(inner.elementType);
        if (typeof nName !== 'string') {
          return undefined;
        }
        /** @type {ExpandTupleMemberNode} */
        const mem = {
          type: 'tupleMember',
          name: nName,
          elementType: nType,
          dotDot: true,
        };
        return mem;
      }
      const annotation = toSourceBabelTSOrAny(node.typeAnnotation);
      return ({type: 'rest', annotation});
    }
    case 'TSUnionType': {
      const members = node.types.map(toSourceBabelTSOrAny);
      return ({
        type: 'union',
        members
      });
    }
    case 'TypeLiteral': {
      // Dead case: the Babel TS plugin emits `TSTypeLiteral`, never the
      // Flow `TypeLiteral`. Kept as a guard so a Flow-AST input fails
      // loudly instead of falling through to the default branch silently.
      console.warn('toSourceBabelTS> unexpected Flow TypeLiteral, use TSTypeLiteral');
      debugger;
      return undefined;
    }
    // case 'PropertySignature':
    //   console.warn('toSourceBabelTS> should not happen, handled by TypeLiteral directly');
    //   return `${toSourceBabelTS(node.name)}: ${toSourceBabelTS(node.type)}`;
    case 'Identifier':
      return node.name;
    case 'TSArrayType': {
      const elementType = toSourceBabelTSOrAny(node.elementType);
      return ({
        type: 'array',
        elementType
      });
    }
    case 'TSLiteralType':
      return toSourceBabelTS(node.literal);
    case 'TemplateLiteral': {
      const quasis = node.quasis.map(cookedQuasi);
      const types = (node.expressions ?? []).map(toSourceBabelTSOrAny);
      return ({type: 'templateLiteral', quasis, types});
    }
    // expandTypeBabelTS("any")
    case 'TSAnyKeyword':
      return 'any';
    // expandTypeBabelTS("boolean")
    case 'TSBooleanKeyword':
      return 'boolean';
    // expandTypeBabelTS('true | false');
    case 'BooleanLiteral':
      return node.value;
    // ts.SyntaxKind[parseType("*").kind] === 'JSDocAllType'
    // But Babel-TS doesn't parse it atm
    //case 'JSDocAllType':
    // expandTypeBabelTS('null')
    case 'TSNullKeyword':
      return 'null';
    // expandTypeBabelTS('123')
    case 'NumericLiteral':
      return typeof node.value === 'number' ? node.value : Number(node.extra.raw);
    case 'StringLiteral':
      return node.extra.raw;
    // expandTypeBabelTS('undefined')
    case 'TSUndefinedKeyword':
      return 'undefined';
    case 'TSUnknownKeyword':
      return 'unknown';
    case 'TSNeverKeyword':
      return 'never';
    // parseTypeBabelTS('void');
    case 'TSVoidKeyword':
      return 'void';
    // expandTypeBabelTS('this')
    case 'TSThisType':
      return 'this';
    case 'ObjectKeyword':
      return {
        type: 'object',
        properties: {}
      };
    case 'ParenthesizedType':
      // fall-through for parentheses
      return toSourceBabelTS(node.type);
    case 'TSParenthesizedType':
      return toSourceBabelTS(node.typeAnnotation);
    case 'LastTypeNode':
      return toSourceBabelTS(node.qualifier);
    case 'TSTypeQuery': {
      const argument = toSourceBabelTSOrAny(node.exprName);
      return ({type: 'typeof', argument});
    }
    case 'TSConditionalType': {
      const checkType = toSourceBabelTSOrAny(node.checkType);
      const extendsType = toSourceBabelTSOrAny(node.extendsType);
      const trueType = toSourceBabelTSOrAny(node.trueType);
      const falseType = toSourceBabelTSOrAny(node.falseType);
      return ({type: 'condition', checkType, extendsType, trueType, falseType});
    }
    case 'TSIndexedAccessType': {
      const index = toSourceBabelTSOrAny(node.indexType);
      const object = toSourceBabelTSOrAny(node.objectType);
      return ({type: 'indexedAccess', index, object});
    }
    case 'TSMappedType': {
      const param = node.typeParameter;
      const nameNode = param?.name;
      const element = typeof nameNode === 'string' ? nameNode : toSourceBabelTS(nameNode);
      const iterable = toSourceBabelTSOrAny(param?.constraint);
      const result = toSourceBabelTSOrAny(node.typeAnnotation);
      if (typeof element !== 'string') {
        return undefined;
      }
      /** @type {ExpandMappingNode} */
      const out = {
        type: 'mapping',
        iterable,
        element,
        result,
      };
      if (node.nameType) {
        out.nameType = toSourceBabelTSOrAny(node.nameType);
      }
      if (node.optional !== undefined && node.optional !== false && node.optional !== null) {
        out.question = node.optional === '-' ? '-' : node.optional === '+' ? '+' : '?';
      }
      if (node.readonly !== undefined && node.readonly !== false && node.readonly !== null) {
        out.readonly = node.readonly === '-' ? '-' : node.readonly === '+' ? '+' : 'readonly';
      }
      return out;
    }
    case 'TSTypeAnnotation':
      return toSourceBabelTS(node.typeAnnotation);
    case 'TSTypeLiteral': {
      /** @type {Object<string, ExpandedType>} */
      const properties = {};
      /** @type {ExpandIndexSignatureNode[] | undefined} */
      let indexSignatures;
      for (const member of node.members ?? []) {
        if (member.type === 'TSIndexSignature') {
          indexSignatures = indexSignatures ?? [];
          const indexSignature = toSourceBabelTS(member);
          if (isIndexSignatureNode(indexSignature)) {
            indexSignatures.push(indexSignature);
          }
        } else if (member.type === 'TSPropertySignature') {
          const name = toSourceBabelTS(member.key);
          /** @type {ExpandedType} */
          let type = toSourceBabelTSOrAny(member.typeAnnotation);
          if (member.optional) {
            if (isExpandedObject(type)) type.optional = true;
            else type = {type, optional: true};
          }
          if (member.readonly) {
            if (isExpandedObject(type)) type.readonly = true;
            else type = {type, readonly: true};
          }
          if (typeof name === 'string') {
            properties[name] = type;
          }
        } else {
          console.warn('TSTypeLiteral: unhandled member', member.type);
        }
      }
      /** @type {ExpandObjectNode} */
      const ret = {type: 'object'};
      if (Object.keys(properties).length) {
        ret.properties = properties;
      }
      if (indexSignatures) {
        ret.indexSignatures = indexSignatures;
      }
      return ret;
    }
    case 'TSIndexSignature': {
      const indexType = toSourceBabelTSOrAny(node.typeAnnotation);
      const indexParameters = (node.parameters ?? []).map(toBabelIndexParameterOrAny);
      return ({type: 'indexSignature', indexType, indexParameters});
    }
    case 'TSTypeOperator':
      if (node.operator === 'readonly') {
        // readonly erased at runtime, same shape as the inner type.
        return toSourceBabelTS(node.typeAnnotation);
      }
      if (node.operator === 'keyof') {
        const keyofArg = toSourceBabelTSOrAny(node.typeAnnotation);
        return ({type: 'keyof', argument: keyofArg});
      }
      if (node.operator === 'unique') {
        // `unique symbol` is a symbol at runtime; uniqueness refers to a
        // specific declaration which we cannot track here.
        return toSourceBabelTS(node.typeAnnotation);
      }
      console.warn('unimplemented TSTypeOperator', node.operator);
      return 'any';
    case 'TSQualifiedName':
      return `${toSourceBabelTS(node.left)}.${toSourceBabelTS(node.right)}`;
    default:
      console.warn('toSourceBabelTS> unhandled type', node.type, node);
      debugger;
  }
}
export {expandTypeBabelTS, parseTypeBabelTS, toSourceBabelTS};
