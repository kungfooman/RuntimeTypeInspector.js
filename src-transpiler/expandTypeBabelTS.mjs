import {parse} from '@babel/parser';
/**
 * @todo Better handling of weird case: Array<>
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
 * @param {string} type - The input type.
 * @returns {string|object|undefined} - See `toSourceBabelTS`.
 */
function expandTypeBabelTS(type) {
  const ast = parseTypeBabelTS(type);
  return toSourceBabelTS(ast);
}
/**
 * @param {string} str - The type string.
 * @returns {import('@babel/types').Node} - The node containing all the information about the input type string.
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
 * Converts a Babel AST node to its source string representation or structured type object.
 *
 * This function handles a variety of node types provided by Babel and converts them into a string
 * or an intermediate object representing the type, depending on the complexity of the type described by the node.
 *
 * @param {import('@babel/types').Node} node - The Babel AST node to convert.
 * @returns {string|object|undefined} - A string, object representing a structured type, or `undefined` for unhandled types.
 * Depending on the node, it may return a simple type string (e.g., `"string"` for `TSStringKeyword`),
 * a structured type object (e.g., a record type for `TSTypeReference` with type arguments),
 * or `undefined` if the encountered type is not handled. Unhandled types trigger a warning and enter a debugger statement.
 */
function toSourceBabelTS(node) {
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
      if (!node.typeParameters) {
        // console.log(`node.typeName.name=${node.typeName.name} name=${name}`, node);
        return node.typeName.name;
      }
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
        const key = toSourceBabelTS(typeArguments[0]);
        const val = toSourceBabelTS(typeArguments[1]);
        return {type: 'map', key, val};
      } else if (name === 'Array' && typeArguments?.length === 1) {
        const elementType = toSourceBabelTS(typeArguments[0]);
        return {type: 'array', elementType};
      } else if (name === 'Promise' && typeArguments?.length === 1) {
        const elementType = toSourceBabelTS(typeArguments[0]);
        return {type: 'promise', elementType};
      } else if (name === 'Set' && typeArguments?.length === 1) {
        const elementType = toSourceBabelTS(typeArguments[0]);
        return {type: 'set', elementType};
      } else if (name === 'Class' && typeArguments?.length === 1) {
        const elementType = toSourceBabelTS(typeArguments[0]);
        return {type: 'class', elementType};
      }
      console.warn('unhandled TypeReference', node);
      return {type: 'unhandled TypeReference'};
    }
    case 'TSStringKeyword':
      return 'string';
    case 'TSNumberKeyword':
      return 'number';
    case 'TSIntersectionType':
      return {
        type: 'intersection',
        members: node.types.map(toSourceBabelTS)
      };
    case 'TSTupleType':
      return {
        type: 'tuple',
        elements: node.elementTypes.map(toSourceBabelTS)
      };
    case 'TSUnionType':
      return {
        type: 'union',
        members: node.types.map(toSourceBabelTS)
      };
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
      };
    // case 'PropertySignature':
    //   console.warn('toSourceBabelTS> should not happen, handled by TypeLiteral directly');
    //   return `${toSourceBabelTS(node.name)}: ${toSourceBabelTS(node.type)}`;
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
    case 'LastTypeNode':
      return toSourceBabelTS(node.qualifier);
    default:
      console.warn('toSourceBabelTS> unhandled type', node.type, node);
      debugger;
  }
}
export {expandTypeBabelTS, parseTypeBabelTS, toSourceBabelTS};
