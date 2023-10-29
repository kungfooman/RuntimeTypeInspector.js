import {parse} from '@babel/parser';
/**
 * @todo implement TypeQuery, e.g. for expandTypeBabelTS('typeof Number');
 * @example
 * const { expandTypeBabelTS } = await import("./src-transpiler/expandTypeBabelTS.mjs");
 * expandTypeBabelTS('[string, Array|AnyTypedArray, number[]]|[ONNXTensor]');
 * expandTypeBabelTS('(123)                    '); // Outputs: '123'
 * expandTypeBabelTS('  ( ( 123 ) )            '); // Outputs: '123'
 * expandTypeBabelTS('Array<number>            '); // Outputs: {type: 'array', elementType: 'number'}
 * expandTypeBabelTS('Array<(123) >            '); // Outputs: {type: 'array', elementType: '123'}
 * expandTypeBabelTS('Array<"abc" | 123>       '); // Outputs: {type: 'array', elementType: { type: 'union', members: [ '"abc"', '123' ]}}
 * expandTypeBabelTS('  (string ) |(number )   '); // Outputs: {type: 'union', members: [ 'string', 'number']}
 * expandTypeBabelTS(' "apples" | ( "bananas") '); // Outputs: {type: 'union', members: [ '"apples"', '"bananas"']}
 * expandTypeBabelTS('123?                     '); // Outputs: {"type":"union","members":["123","null"]}
 * expandTypeBabelTS('123|null                 '); // Outputs: {"type":"union","members":["123","null"]}
 * expandTypeBabelTS('Map<string, any>');
 * expandTypeBabelTS("(a: number, b: number) => number")
 * @param {string} type
 */
function expandTypeBabelTS(type) {
  const ast = parseTypeBabelTS(type);
  return toSourceBabelTS(ast);
}
/**
 * @param {string} str - The type string.
 * @returns {import('@babel/types').Node}
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
  return ast.program.body[0].typeAnnotation;
}
/**
 * @param {TypeScriptType} node 
 * @returns 
 */
function toSourceBabelTS(node) {
  const {typeName} = node;
  const kind_ = ts.SyntaxKind[node.kind];
  // console.log({typeName, kind_, node});
  switch (node.type) {
    // expandTypeBabelTS("(a: number, b: number) => number")
    /**
     * @todo the parameters are given as identifiers with "typeAnnotation"
     */
    // case 'TSFunctionType':
    //   const parameters = node.parameters.map(toSourceBabelTS);
    //   // I wish Babel AST would be like tsc AST here:
    //   // parseType("(a: number, b: number) => number").parameters[0].kind === ts.SyntaxKind.Parameter
    //   return {type: 'function', parameters};
    // Fix first: https://github.com/babel/babel/issues/16073
    //case 'JSDocNullableType':
    //  const t = toSourceBabelTS(node.type);
    //  return {type: 'union', members: [t, 'null']};
    // todo work out more: const jsdoc = `(...a: ...number) => 123
    // TS even thinks it's two parameters... just go for array/[]
    //case 'Parameter':
    //  const type = node.type ? toSourceBabelTS(node.type) : 'any';
    //  const name = toSourceBabelTS(node.name);
    //  const ret = {type, name};
    //  if (node.dotDotDotToken) {
    //    return {type: 'array', elementType: ret};
    //  }
    //  return ret;
    case 'TSTypeReference': {
      const name = toSourceBabelTS(node.typeName);
      console.assert(node.typeParameters.type === 'TSTypeParameterInstantiation');
      const typeArguments = node.typeParameters.params;
      if ((name === 'Object' || name === 'Record') && typeArguments?.length === 2) {
        return {
          type: 'record',
          key: toSourceBabelTS(typeArguments[0]),
          val: toSourceBabelTS(typeArguments[1]),
        };
      } else if (name === 'Object' && (!typeArguments || typeArguments?.length === 0)) {
        return {type: 'object', properties: {}};
      } else if (name === 'Map' && typeArguments?.length === 2) {
        return {
          type: 'map',
          key: toSourceBabelTS(typeArguments[0]),
          val: toSourceBabelTS(typeArguments[1]),
        };
      } else if (name === 'Array' && typeArguments?.length === 1) {
        const elementType = toSourceBabelTS(typeArguments[0]);
        return {type: 'array', elementType};
      } else if (name === 'Set' && typeArguments?.length === 1) {
        const elementType = toSourceBabelTS(typeArguments[0]);
        return {type: 'set', elementType};
      } else if (name === 'Class' && typeArguments?.length === 1) {
        return {
          type: 'class',
          elementType: toSourceBabelTS(typeArguments[0])
        }
      } else {
        if (!typeArguments) {
          return typeName.name;
        }
        console.warn('unhandled TypeReference', kind_, node);
        return {
          type: 'unhandled TypeReference'
        };
      }
      break;
    }
    case 'TSStringKeyword':
      return 'string';
    case 'TSNumberKeyword':
      return 'number';
    case 'TSIntersectionType':
      return {
        type: 'intersection',
        members: node.types.map(toSourceBabelTS)
      }
    case 'TSTupleType':
      return {
        type: 'tuple',
        elements: node.elementTypes.map(toSourceBabelTS)
      }
    case 'TSUnionType':
      return {
        type: 'union',
        members: node.types.map(toSourceBabelTS)
      }
    case 'TypeLiteral':
      const properties = {};
      node.members.forEach(member => {
        const name = toSourceBabelTS(member.name);
        const type = toSourceBabelTS(member.type);
        properties[name] = type;
      });
      return {
        type: 'object',
        properties
      }
    //case 'PropertySignature':
    //  console.warn('toSourceBabelTS> should not happen, handled by TypeLiteral directly');
    //  return `${toSourceBabelTS(node.name)}: ${toSourceBabelTS(node.type)}`;
    case 'Identifier':
      return node.name;
    case 'TSArrayType':
      return {
        type: 'array',
        elementType: toSourceBabelTS(node.elementType)
      };
    case 'TSLiteralType':
      return toSourceBabelTS(node.literal);
    // expandTypeBabelTS("any")
    case 'TSAnyKeyword':
      return 'any';
    // expandTypeBabelTS("boolean")
    case 'TSBooleanKeyword':
      return 'boolean';
    // expandTypeBabelTS('true | false');
    case 'BooleanLiteral':
      return node.value.toString();
    // ts.SyntaxKind[parseType("*").kind] === 'JSDocAllType'
    // But Babel-TS doesn't parse it atm
    //case 'JSDocAllType':
    // expandTypeBabelTS('null')
    case 'TSNullKeyword':
      return 'null';
    // expandTypeBabelTS('123')
    case 'NumericLiteral':
    case 'StringLiteral':
      return node.extra.raw;
    // expandTypeBabelTS('undefined')
    case 'TSUndefinedKeyword':
      return 'undefined';
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
      }
    case 'ParenthesizedType':
      // fall-through for parentheses
      return toSourceBabelTS(node.type);
    case 'LastTypeNode':
      return toSourceBabelTS(node.qualifier);
    default:
      console.warn('toSourceBabelTS> unhandled type', node.type, node);
      debugger;
  }
}
export {expandTypeBabelTS, parseTypeBabelTS, toSourceBabelTS};
