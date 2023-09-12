import ts from 'typescript';

/**
 * @todo Handle FirstLiteralToken
 * @example
 * const { expandType } = await import("./src/expandType.mjs");
 * expandType('(123)                    '); // Outputs: TODO
 * expandType('Array<number>            '); // Outputs: { type: 'array', elementType: 'number' }
 * expandType('Array<(123) >            '); // Outputs: TODO
 * expandType('  ( ( 123 ) )            '); // Outputs: TODO
 * expandType('  (string ) |(number )   '); // Outputs: { type: 'union', members: [ 'string', 'number' ] }
 * expandType(' "apples" | ( "bananas") '); // Outputs: { type: 'union', members: [ '"apples"', '"bananas"' ] }
 * @param {string} type
 */
function expandType(type) {
  const ast = parseType(type);
  return toSourceTS(ast);
}

/**
 * @typedef TypeScriptType
 * @property {*} typeArguments
 * @property {*} typeName
 * @property {number} kind
 */

/**
 * @param {string} str - The type string.
 * @returns {TypeScriptType}
 */
function parseType(str) {
  str = `type tmp = ${str};`;
  let ast = ts.createSourceFile('repl.ts', str, ts.ScriptTarget.Latest, true /*setParentNodes*/);
  return ast.statements[0].type;
}

/**
 * @param {TypeScriptType} node 
 * @returns 
 */
function toSourceTS(node) {
  const { typeArguments, typeName } = node;
  const kind_ = ts.SyntaxKind[node.kind];
  // console.log({ typeArguments, typeName, kind_, node });
  switch (kind_) {
    case 'TypeReference':
      if (typeName.text === 'Object' && typeArguments.length === 2) {
        return {
          type: 'record',
          key: toSourceTS(typeArguments[0]),
          val: toSourceTS(typeArguments[1]),
        };
      } else if (typeName.text === 'Array' && typeArguments.length === 1) {
        return {
          type: 'array',
          elementType: toSourceTS(typeArguments[0])
        };
      } else if (typeName.text === 'Class' && typeArguments.length === 1) {
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
    case 'StringKeyword':
      return node.getText();
    case 'NumberKeyword':
      return node.getText();
    case 'IntersectionType':
      return {
        type: 'intersection',
        members: node.types.map(toSourceTS)
      }
    case 'TupleType':
      return {
        type: 'tuple',
        elements: node.elements.map(toSourceTS)
      }
    case 'UnionType':
      return {
        type: 'union',
        members: node.types.map(toSourceTS)
      }
    case 'TypeLiteral':
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
    case 'PropertySignature':
      console.warn('toSourceTS> should not happen, handled by TypeLiteral directly');
      return `${toSourceTS(node.name)}: ${toSourceTS(node.type)}`;
    case 'Identifier':
      return node.text;
    case 'ArrayType':
      return {
        type: 'array',
        elementType: toSourceTS(node.elementType)
      };
    case 'LiteralType':
      return toSourceTS(node.literal);
    case 'UndefinedKeyword':
    case 'NullKeyword':
    case 'BooleanKeyword':
    case 'JSDocAllType':
    case 'ThisType':
    case 'AnyKeyword':
    case 'StringLiteral': // 'a'|'b'
      return node.getText();
    case 'ObjectKeyword':
      return {
        type: 'object',
        properties: {}
      }
    case 'ParenthesizedType':
      // fall-through for parentheses
      return toSourceTS(node.type);
    case 'LastTypeNode':
      return toSourceTS(node.qualifier);
    default:
      debugger;
      console.log('unhandled', kind_, node);
  }
}

export { expandType };
