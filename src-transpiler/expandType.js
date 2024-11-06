import ts from 'typescript';
/**
 * Transforms a type string into a structured type representation.
 *
 * This function parses a given type string and converts it into a TypeScript
 * Abstract Syntax Tree (AST), then uses that AST to return a structured type
 * representation that can be further utilized or interpreted.
 *
 * @todo Better handling of weird case: Array<>
 * @example
 * const {expandType} = await import("./src-transpiler/expandType.js");
 * expandType('[string, Array|AnyTypedArray, number[]]|[ONNXTensor]');
 * expandType('(123)                    '); // Outputs: '123'
 * expandType('  ( ( 123 ) )            '); // Outputs: '123'
 * expandType('Array<number>            '); // Outputs: {type: 'array', elementType: 'number'}
 * expandType('Array<(123) >            '); // Outputs: {type: 'array', elementType: '123'}
 * expandType('Array<"abc" | 123>       '); // Outputs: {type: 'array', elementType: {type: 'union', members: ['"abc"', '123']}}
 * expandType('  (string ) |(number )   '); // Outputs: {type: 'union', members: [ 'string', 'number']}
 * expandType(' "apples" | ( "bananas") '); // Outputs: {type: 'union', members: [ '"apples"', '"bananas"']}
 * expandType('123?                     '); // Outputs: {"type":"union","members":["123","null"]}
 * expandType('123|null                 '); // Outputs: {"type":"union","members":["123","null"]}
 * expandType('Map<string, any>         '); // Outputs:
 * expandType('typeof Number            '); // Outputs:
 * @param {string} type - The type string to be expanded into a structured representation.
 * @todo Share type with expandTypeBabelTS and expandTypeDepFree
 * @returns {string | number | boolean | {type: string, [key: string]: any} | undefined} The structured type
 * representation obtained from parsing and converting the provided type string.
 */
function expandType(type) {
  const ast = parseType(type);
  if (!ast) {
    return 'never';
  }
  return toSourceTS(ast);
}
/**
 * @param {string} str - The type string.
 * @returns {ts.TypeNode|undefined} - The node containing all the information about the input type string.
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
  const firstStatement = ast.statements[0];
  if (!ts.isTypeAliasDeclaration(firstStatement)) {
    console.warn('parseType> Expected type alias declaration, got', firstStatement, 'instead.');
    return;
  }
  return firstStatement.type;
}
/** @type {Record<string, 'missing'|'found'>} */
export const requiredTypeofs = {};
/**
 * Converts a TypeScript AST node to a source string representation or to an intermediate object describing the type.
 *
 * This function handles various TypeScript AST node types and converts them into a string
 * or an object representing the type.
 *
 * @param {ts.TypeNode|ts.Identifier|ts.QualifiedName|undefined} node - The TypeScript AST node to convert.
 * @returns {string | number | boolean | {type: string, [key: string]: any} | undefined} The source string/number,
 * or an object with type information based on the node, or `undefined` if the node kind is not handled.
 */
function toSourceTS(node) {
  if (!node) {
    return 'undefined';
  }
  const {typeArguments, typeName} = node;
  const kind_ = ts.SyntaxKind[node.kind];
  const {
    AnyKeyword,          // parseType('any'                            ).kind                 === ts.SyntaxKind.AnyKeyword && toSourceTS(parseType('any')) === 'any'
    ArrayType,           // parseType('number[]'                       ).kind                 === ts.SyntaxKind.ArrayType // todo toSourceTS(parseType('number[]')) === {type: 'array etc.
    BooleanKeyword,      // parseType("boolean"                        ).kind                 === ts.SyntaxKind.BooleanKeyword
    FunctionType,        // parseType("() => void"                     ).kind                 === ts.SyntaxKind.FunctionType
    JSDocFunctionType,   // parseType("function (number, number): number").kind               === ts.SyntaxKind.JSDocFunctionType
    Identifier,          // parseType("{a: 1, b: 2}"                   ).members[0].name.kind === ts.SyntaxKind.Identifier
    IntersectionType,    // parseType("1 & 2"                          ).kind                 === ts.SyntaxKind.IntersectionType
    JSDocAllType,        // parseType("*"                              ).kind                 === ts.SyntaxKind.JSDocAllType
    ImportType,          // parseType('import("test").Test'            ).kind                 === ts.SyntaxKind.ImportType
    LiteralType,         // parseType("123"                            ).kind                 === ts.SyntaxKind.LiteralType
    NullKeyword,         // parseType("null"                           ).literal.kind         === ts.SyntaxKind.NullKeyword
    NumberKeyword,       // parseType("number"                         ).kind                 === ts.SyntaxKind.NumberKeyword
    NumericLiteral,      // parseType("123"                            ).literal.kind         === ts.SyntaxKind.NumericLiteral
    ObjectKeyword,       // parseType("object"                         ).kind                 === ts.SyntaxKind.ObjectKeyword
    Parameter,           // parseType("(a) => void"                    ).parameters[0].kind   === ts.SyntaxKind.Parameter
    ParenthesizedType,   // parseType("(SomeType)"                     ).kind                 === ts.SyntaxKind.ParenthesizedType
    PropertySignature,   // parseType("{a: 1, b: 2}"                   ).members[0].kind      === ts.SyntaxKind.PropertySignature
    StringKeyword,       // parseType("string"                         ).kind                 === ts.SyntaxKind.StringKeyword
    StringLiteral,       // parseType("'test'"                         ).literal.kind         === ts.SyntaxKind.StringLiteral
    ThisType,            // parseType("this"                           ).kind                 === ts.SyntaxKind.ThisType
    TupleType,           // parseType("[1, 2, 3]"                      ).kind                 === ts.SyntaxKind.TupleType
    TypeLiteral,         // parseType("{a: 1, b: 2}"                   ).kind                 === ts.SyntaxKind.TypeLiteral
    TypeReference,       // parseType("SomeOtherType"                  ).kind                 === ts.SyntaxKind.TypeReference
    UndefinedKeyword,    // parseType("undefined"                      ).kind                 === ts.SyntaxKind.UndefinedKeyword
    UnionType,           // parseType("1|2"                            ).kind                 === ts.SyntaxKind.UnionType
    JSDocNullableType,   // parseType("?lol?"                          ).kind                 === ts.SyntaxKind.JSDocNullableType
    TrueKeyword,         // parseType("true"                           ).literal.kind         === ts.SyntaxKind.TrueKeyword
    FalseKeyword,        // parseType("false"                          ).literal.kind         === ts.SyntaxKind.FalseKeyword
    VoidKeyword,         // parseType("void"                           ).kind                 === ts.SyntaxKind.VoidKeyword
    UnknownKeyword,      // parseType("unknown"                        ).kind                 === ts.SyntaxKind.UnknownKeyword
    NeverKeyword,        // parseType("never"                          ).kind                 === ts.SyntaxKind.NeverKeyword
    BigIntKeyword,       // parseType("bigint"                         ).kind                 === ts.SyntaxKind.BigIntKeyword
    BigIntLiteral,       // parseType("123n"                           ).literal.kind         === ts.SyntaxKind.BigIntLiteral
    ConditionalType,     // parseType("1 extends number ? true : false").kind                 === ts.SyntaxKind.ConditionalType
    IndexedAccessType,   // parseType('Test[123]'                      ).kind                 === ts.SyntaxKind.IndexedAccessType
    IndexSignature,      // parseType('{[n: number]: string}'          ).members[0].kind      === ts.SyntaxKind.IndexSignature
    RestType,            // parseType("[...number]"                    ).elements[0].kind     === ts.SyntaxKind.RestType
    TypeQuery,           // parseType('typeof Number'                  ).kind                 === ts.SyntaxKind.TypeQuery
    TypeOperator,        // parseType('keyof typeof obj'               ).kind                 === ts.SyntaxKind.TypeOperator
    KeyOfKeyword,        // parseType('keyof typeof obj'               ).operator             === ts.SyntaxKind.KeyOfKeyword
    ConstructorType,     // parseType('new (...args: any[]) => any'    ).kind                 === ts.SyntaxKind.ConstructorType
    NamedTupleMember,    // parseType('[a: 1]'                         ).elements[0].kind     === ts.SyntaxKind.NamedTupleMember
    MappedType,          // parseType('{[K in TaskType]: 123}'         ).kind                 === ts.SyntaxKind.MappedType
    TypeParameter,       // parseType('{[K in TaskType]: 123}'         ).typeParameter.kind   ===  ts.SyntaxKind.TypeParameter
    QualifiedName,       // parseType("import('abc').x.y"              ).qualifier.kind       === ts.SyntaxKind.QualifiedName
  } = ts.SyntaxKind;
  // console.log({typeArguments, typeName, kind_, node});
  switch (node.kind) {
    case BigIntKeyword:
      return {type: 'bigint'};
    case BigIntLiteral:
      if (!ts.isBigIntLiteral(node)) {
        throw Error("Impossible");
      }
      const literal = node.text.slice(0, -1); // Remove the "n"
      return {type: 'bigint', literal};
    case ConditionalType:
      if (!ts.isConditionalTypeNode(node)) {
        throw Error("Impossible");
      }
      // Keys on node:
      // ['pos', 'end', 'flags', 'modifierFlagsCache', 'transformFlags', 'parent', 'kind', 'checkType',
      // 'extendsType', 'trueType', 'falseType', 'locals', 'nextContainer']
      const checkType   = toSourceTS(node.checkType  );
      const extendsType = toSourceTS(node.extendsType);
      const trueType    = toSourceTS(node.trueType   );
      const falseType   = toSourceTS(node.falseType  );
      return {type: 'condition', checkType, extendsType, trueType, falseType};
    case ConstructorType: {
      if (!ts.isConstructorTypeNode(node)) {
        throw Error("Impossible");
      }
      const parameters = node.parameters.map(toSourceTS);
      const ret = toSourceTS(node.type);
      return {type: 'new', parameters, ret};
    }
    case FunctionType: {
      if (!ts.isFunctionTypeNode(node)) {
        throw Error("Impossible");
      }
      const parameters = node.parameters.map(toSourceTS);
      return {type: 'function', parameters};
    }
    case JSDocFunctionType: {
      if (!ts.isJSDocFunctionType(node)) {
        throw Error("Impossible");
      }
      const parameters = node.parameters.map(toSourceTS);
      return {type: 'function', parameters};
    }
    case IndexedAccessType:
      if (!ts.isIndexedAccessTypeNode(node)) {
        throw Error("Impossible");
      }
      const index  = toSourceTS(node.indexType);
      const object = toSourceTS(node.objectType);
      return {type: 'indexedAccess', index, object};
    case RestType:
      if (!ts.isRestTypeNode(node)) {
        throw Error("Impossible");
      }
      const annotation = toSourceTS(node.type);
      return {type: 'rest', annotation};
    case JSDocNullableType:
      if (!ts.isJSDocNullableType(node)) {
        throw Error("Impossible");
      }
      const t = toSourceTS(node.type);
      return {type: 'union', members: [t, 'null']};
    case MappedType: {
      if (!ts.isMappedTypeNode(node)) {
        throw Error("Impossible");
      }
      const result = toSourceTS(node.type);
      const parameter = node.typeParameter;
      if (parameter.kind === TypeParameter) {
        // For example: {[K in TaskType]: InstanceType etc.
        const iterable = toSourceTS(parameter.constraint); // TaskType
        const element = toSourceTS(parameter.name); // K
        return {type: 'mapping', iterable, element, result};
      }
      console.warn("MappedType: expected TypeParameter");
      return 'transpiler-error';
    }
    // todo work out more: const jsdoc = `(...a: ...number) => 123
    // TS even thinks it's two parameters... just go for array/[]
    case Parameter:
      if (!ts.isParameter(node)) {
        throw Error("Impossible");
      }
      const type = node.type ? toSourceTS(node.type) : 'any';
      const name = toSourceTS(node.name);
      const ret = {type, name};
      if (node.dotDotDotToken) {
        return {type: 'array', elementType: ret};
      }
      return ret;
    case TypeQuery:
      if (!ts.isTypeQueryNode(node)) {
        throw Error("Impossible");
      }
      const argument = toSourceTS(node.exprName);
      // Notify Asserter class that we have to register variables with this name
      if (!requiredTypeofs[argument]) {
        requiredTypeofs[argument] = 'missing';
      }
      return {type: 'typeof', argument};
    case TypeOperator:
      if (!ts.isTypeOperatorNode(node)) {
        throw Error("Impossible");
      }
      if (node.operator === KeyOfKeyword) {
        const argument = toSourceTS(node.type);
        return {type: 'keyof', argument};
      }
      console.warn("unimplemented TypeOperator", node);
    case TypeReference: {
      if (!ts.isTypeReferenceNode(node)) {
        throw Error("Impossible");
      }
      if ((typeName.text === 'Object' || typeName.text === 'Record') && typeArguments?.length === 2) {
        return {
          type: 'record',
          key: toSourceTS(typeArguments[0]),
          val: toSourceTS(typeArguments[1]),
        };
      } else if (typeName.text === 'Object' && (!typeArguments || typeArguments?.length === 0)) {
        return {type: 'object', properties: {}};
      } else if (typeName.text === 'Map' && typeArguments?.length === 2) {
        const key = toSourceTS(typeArguments[0]);
        const val = toSourceTS(typeArguments[1]);
        return {type: 'map', key, val};
      } else if (typeName.text === 'Array' && typeArguments?.length === 1) {
        const elementType = toSourceTS(typeArguments[0]);
        return {type: 'array', elementType};
      } else if (typeName.text === 'Promise' && typeArguments?.length === 1) {
        const elementType = toSourceTS(typeArguments[0]);
        return {type: 'promise', elementType};
      } else if (typeName.text === 'Set' && typeArguments?.length === 1) {
        const elementType = toSourceTS(typeArguments[0]);
        return {type: 'set', elementType};
      } else if (typeName.text === 'Class' && typeArguments?.length === 1) {
        const elementType = toSourceTS(typeArguments[0]);
        return {type: 'class', elementType};
      }
      if (!typeArguments) {
        return typeName.getText();
      }
      const name = typeName.text;
      const args = typeArguments.map(toSourceTS);
      return {type: 'reference', name, args};
    }
    case NamedTupleMember:
      if (!ts.isNamedTupleMember(node)) {
        throw Error("Impossible");
      }
      return toSourceTS(node.type);
    case IntersectionType: {
      if (!ts.isIntersectionTypeNode(node)) {
        throw Error("Impossible");
      }
      const members = node.types.map(toSourceTS);
      return {type: 'intersection', members};
    }
    case TupleType:
      if (!ts.isTupleTypeNode(node)) {
        throw Error("Impossible");
      }
      const elements = node.elements.map(toSourceTS);
      return {type: 'tuple', elements};
    case UnionType:
      if (!ts.isUnionTypeNode(node)) {
        throw Error("Impossible");
      }
      const members = node.types.map(toSourceTS);
      return {type: 'union', members};
    case TypeLiteral: {
      if (!ts.isTypeLiteralNode(node)) {
        throw Error("Impossible");
      }
      const properties = {};
      /** @type {object[]} */
      let indexSignatures;
      node.members.forEach(member => {
        if (member.kind === IndexSignature) {
          indexSignatures = indexSignatures ?? [];
          indexSignatures.push(toSourceTS(member));
        } else if (member.kind === PropertySignature) {
          if (!ts.isPropertySignature(member)) {
            throw Error("Impossible");
          }
          const name = toSourceTS(member.name);
          const type = toSourceTS(member.type);
          properties[name] = type;
        } else {
          console.warn('TypeLiteral: unhandled member', member);
        }
      });
      const ret = {type: 'object'};
      if (Object.keys(properties).length) {
        ret.properties = properties;
      }
      if (indexSignatures) {
        ret.indexSignatures = indexSignatures;
      }
      return ret;
    }
    case PropertySignature:
      if (!ts.isPropertySignature(node)) {
        throw Error("Impossible");
      }
      console.warn('toSourceTS> should not happen, handled by TypeLiteral directly');
      return `${toSourceTS(node.name)}: ${toSourceTS(node.type)}`;
    case IndexSignature:
      if (!ts.isIndexSignatureDeclaration(node)) {
        throw Error("Impossible");
      }
      // Only possible modifier I know of, but we don't need it:
      //   {readonly [n: number]: string, length: number}
      const indexType = toSourceTS(node.type);
      const indexParameters = node.parameters.map(toSourceTS);
      return {type: 'indexSignature', indexType, indexParameters};
    case Identifier:
      if (!ts.isIdentifier(node)) {
        throw Error("Impossible");
      }
      return node.text;
    case ArrayType: {
      if (!ts.isArrayTypeNode(node)) {
        throw Error("Impossible");
      }
      const elementType = toSourceTS(node.elementType);
      return {type: 'array', elementType};
    }
    case LiteralType:
      if (!ts.isLiteralTypeNode(node)) {
        throw Error("Impossible");
      }
      return toSourceTS(node.literal);
    case       AnyKeyword:
    case   BooleanKeyword:
    case    StringKeyword:
    case     NeverKeyword:
    case      NullKeyword:
    case    NumberKeyword:
    case UndefinedKeyword:
    case   UnknownKeyword:
    case      VoidKeyword:
    // ts.SyntaxKind[parseType("*").kind] === 'JSDocAllType'
    case JSDocAllType:
    case     ThisType:
    case StringLiteral:
      return node.getText();
    case TrueKeyword:
      return true;
    case FalseKeyword:
      return false;
    case NumericLiteral:
      return Number(node.getText());
    case ObjectKeyword:
      return {
        type: 'object',
        properties: {}
      };
    case ParenthesizedType:
      if (!ts.isParenthesizedTypeNode(node)) {
        throw Error("Impossible");
      }
      // fall-through for parentheses
      return toSourceTS(node.type);
    // toSourceTS(parseType("import('abc').x.y.z"))
    case QualifiedName:
      if (!ts.isQualifiedName(node)) {
        throw Error("Impossible");
      }
      const l = toSourceTS(node.left);
      const r = toSourceTS(node.right);
      return `${l}.${r}`;
    case ImportType:
      if (!ts.isImportTypeNode(node)) {
        throw Error("Impossible");
      }
      /** @todo Handle case without any qualifier like `import('test')` */
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
