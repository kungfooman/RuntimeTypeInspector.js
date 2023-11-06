import ts from 'typescript';
/**
 * @todo Better handling of weird case: Array<>
 * @todo implement TypeQuery, e.g. for expandType('typeof Number');
 * @example
 * const { expandType } = await import("./src-transpiler/expandType.mjs");
 * expandType('[string, Array|AnyTypedArray, number[]]|[ONNXTensor]');
 * expandType('(123)                    '); // Outputs: '123'
 * expandType('  ( ( 123 ) )            '); // Outputs: '123'
 * expandType('Array<number>            '); // Outputs: {type: 'array', elementType: 'number'}
 * expandType('Array<(123) >            '); // Outputs: {type: 'array', elementType: '123'}
 * expandType('Array<"abc" | 123>       '); // Outputs: {type: 'array', elementType: { type: 'union', members: [ '"abc"', '123' ]}}
 * expandType('  (string ) |(number )   '); // Outputs: {type: 'union', members: [ 'string', 'number']}
 * expandType(' "apples" | ( "bananas") '); // Outputs: {type: 'union', members: [ '"apples"', '"bananas"']}
 * expandType('123?                     '); // Outputs: {"type":"union","members":["123","null"]}
 * expandType('123|null                 '); // Outputs: {"type":"union","members":["123","null"]}
 * expandType('Map<string, any>');
 * @param {string} type
 */
function expandType(type) {
  const ast = parseType(type);
  return toSourceTS(ast);
}
/**
 * @typedef TypeScriptType
 * @property {object[]|undefined} typeArguments
 * @property {*} typeName
 * @property {number} kind
 */
/**
 * @param {string} str - The type string.
 * @returns {TypeScriptType}
 */
function parseType(str) {
  // TS doesn't like ... notation in this context
  if (str.startsWith('...')) {
    str = str.slice(3); // remove dots
    str += '[]'; // turn into array
  }
  // type tmp = (...string) => 123; to have a function context
  str = `type tmp = ${str};`;
  const ast = ts.createSourceFile('repl.ts', str, ts.ScriptTarget.Latest, true /*setParentNodes*/);
  return ast.statements[0].type;
}
/**
 * @param {TypeScriptType} node 
 * @returns 
 */
function toSourceTS(node) {
  const {typeArguments, typeName} = node;
  const kind_ = ts.SyntaxKind[node.kind];
  const {
    AnyKeyword, ArrayType, BooleanKeyword, FunctionType, Identifier, IntersectionType,
    JSDocAllType, LastTypeNode, LiteralType, NullKeyword, NumberKeyword, NumericLiteral,
    ObjectKeyword, Parameter, ParenthesizedType, PropertySignature, StringKeyword,
    StringLiteral, ThisType, TupleType, TypeLiteral, TypeReference, UndefinedKeyword,
    UnionType, JSDocNullableType, TrueKeyword, FalseKeyword, VoidKeyword, UnknownKeyword,
    NeverKeyword,
    ConstructorType, // parseType('new (...args: any[]) => any');
  } = ts.SyntaxKind;
  // console.log({ typeArguments, typeName, kind_, node });
  switch (node.kind) {
    case ConstructorType: {
      const parameters = node.parameters.map(toSourceTS);
      const ret = toSourceTS(node.type);
      return {type: 'new', parameters, ret};
    }
    case FunctionType:
      const parameters = node.parameters.map(toSourceTS);
      return {type: 'function', parameters};
    case JSDocNullableType:
      const t = toSourceTS(node.type);
      return {type: 'union', members: [t, 'null']};
    // todo work out more: const jsdoc = `(...a: ...number) => 123
    // TS even thinks it's two parameters... just go for array/[]
    case Parameter:
      const type = node.type ? toSourceTS(node.type) : 'any';
      const name = toSourceTS(node.name);
      const ret = {type, name};
      if (node.dotDotDotToken) {
        return {type: 'array', elementType: ret};
      }
      return ret;
    case TypeReference:
      if ((typeName.text === 'Object' || typeName.text === 'Record') && typeArguments?.length === 2) {
        return {
          type: 'record',
          key: toSourceTS(typeArguments[0]),
          val: toSourceTS(typeArguments[1]),
        };
      } else if (typeName.text === 'Object' && (!typeArguments || typeArguments?.length === 0)) {
        return {type: 'object', properties: {}};
      } else if (typeName.text === 'Map' && typeArguments?.length === 2) {
        return {
          type: 'map',
          key: toSourceTS(typeArguments[0]),
          val: toSourceTS(typeArguments[1]),
        };
      } else if (typeName.text === 'Array' && typeArguments?.length === 1) {
        const elementType = toSourceTS(typeArguments[0]);
        return {type: 'array', elementType};
      } else if (typeName.text === 'Set' && typeArguments?.length === 1) {
        const elementType = toSourceTS(typeArguments[0]);
        return {type: 'set', elementType};
      } else if (typeName.text === 'Class' && typeArguments?.length === 1) {
        return {
          type: 'class',
          elementType: toSourceTS(typeArguments[0])
        }
      } else {
        if (!typeArguments) {
          return typeName.getText();
        }
        console.warn('unhandled TypeReference', kind_, node);
        return {
          type: 'unhandled TypeReference'
        };
      }
      break;
    case StringKeyword:
      return node.getText();
    case NumberKeyword:
      return node.getText();
    case IntersectionType:
      return {
        type: 'intersection',
        members: node.types.map(toSourceTS)
      }
    case TupleType:
      return {
        type: 'tuple',
        elements: node.elements.map(toSourceTS)
      }
    case UnionType:
      return {
        type: 'union',
        members: node.types.map(toSourceTS)
      }
    case TypeLiteral:
      const properties = {};
      node.members.forEach(member => {
        const name = toSourceTS(member.name);
        const type = toSourceTS(member.type);
        properties[name] = type;
      });
      return {
        type: 'object',
        properties
      }
    case PropertySignature:
      console.warn('toSourceTS> should not happen, handled by TypeLiteral directly');
      return `${toSourceTS(node.name)}: ${toSourceTS(node.type)}`;
    case Identifier:
      return node.text;
    case ArrayType:
      return {
        type: 'array',
        elementType: toSourceTS(node.elementType)
      };
    case LiteralType:
      return toSourceTS(node.literal);
    case AnyKeyword:
    case BooleanKeyword:
    // ts.SyntaxKind[parseType("*").kind] === 'JSDocAllType'
    case JSDocAllType:
    case NullKeyword:
    case NumericLiteral:
    case StringLiteral:
    case ThisType:
    case UndefinedKeyword:
    case TrueKeyword:
    case FalseKeyword:
    case VoidKeyword:
    case UnknownKeyword:
    case NeverKeyword:
      return node.getText();
    case ObjectKeyword:
      return {
        type: 'object',
        properties: {}
      }
    case ParenthesizedType:
      // fall-through for parentheses
      return toSourceTS(node.type);
    case LastTypeNode:
      return toSourceTS(node.qualifier);
    default:
        // const test = {};
        // Object.entries(ts.SyntaxKind).forEach(([name, id]) => {
        //     test[id] = (test[id] || []);
        //     test[id].push(name);
        // });
        // console.log(test);
      console.warn('toSourceTS> unhandled kind - make sure to understand you cannot reverse TS enums');
      console.warn('if they contain range aliases, for example:');
      console.warn('ts.SyntaxKind.NumericLiteral === ts.SyntaxKind.FirstLiteralToken');
      console.warn('so this "kind" could be wrong, but requires handling anyway:', kind_, node);
      debugger;
  }
}
export {expandType, parseType, toSourceTS};
