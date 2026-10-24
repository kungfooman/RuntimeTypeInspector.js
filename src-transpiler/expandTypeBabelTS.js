import {parse} from '@babel/parser';
/** @typedef {import('./expandedType.js').ExpandedType} ExpandedType */
/** @typedef {import('./expandedType.js').ExpandParameterNode} ExpandParameterNode */
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
    return /** @type {ExpandedType} */ ({type: 'union', members: [expandTypeBabelTS(type.slice(0, -1).trim()), 'null']});
  }
  if (type.startsWith('?') && type.length > 1) {
    return /** @type {ExpandedType} */ ({type: 'union', members: [expandTypeBabelTS(type.slice(1).trim()), 'null']});
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
  return /** @type {{typeAnnotation: *}} */ (first).typeAnnotation;
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
    const type = toSourceBabelTS(param.typeAnnotation?.typeAnnotation);
    const name = param.argument?.name ?? 'args';
    /** @type {ExpandParameterNode} */
    const inner = {type: /** @type {ExpandedType} */ (type), name: /** @type {ExpandedType} */ (name)};
    return /** @type {ExpandedType} */ ({type: 'array', elementType: inner});
  }
  const type = toSourceBabelTS(param?.typeAnnotation?.typeAnnotation);
  const name = param?.name ?? 'arg';
  return /** @type {ExpandedType} */ ({type: /** @type {ExpandedType} */ (type ?? 'any'), name: /** @type {ExpandedType} */ (name)});
}
/**
 * Converts a Babel index signature parameter (`[n: number]`) to a
 * `{type, name}` parameter node, matching the TS parser's `Parameter`
 * case without the rest wrapping.
 * @param {*} param - The Babel parameter node.
 * @returns {ExpandParameterNode} The parameter node.
 */
function toBabelIndexParameter(param) {
  const type = toSourceBabelTS(param?.typeAnnotation?.typeAnnotation);
  const name = param?.name ?? 'arg';
  return {type: /** @type {ExpandedType} */ (type ?? 'any'), name: /** @type {ExpandedType} */ (name)};
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
      const parameters = node.parameters.map(toBabelParameter);
      return /** @type {ExpandedType} */ ({type: 'function', parameters});
    }
    case 'TSConstructorType': {
      const parameters = node.parameters.map(toBabelParameter);
      const ret = toSourceBabelTS(node.typeAnnotation?.typeAnnotation);
      return /** @type {ExpandedType} */ ({type: 'new', parameters, ret});
    }
    case 'TSTypeReference': {
      const name = toSourceBabelTS(node.typeName);
      if (!node.typeParameters) {
        // Bare `Object` is the empty object type, matching expandType().
        if (name === 'Object') {
          return {type: 'object', properties: {}};
        }
        // Bare reference: Identifier gives name, TSQualifiedName gives dotted path.
        return /** @type {ExpandedType | undefined} */ (name);
      }
      console.assert(node.typeParameters.type === 'TSTypeParameterInstantiation');
      const typeArguments = node.typeParameters.params;
      if ((name === 'Object' || name === 'Record') && typeArguments?.length === 2) {
        return /** @type {ExpandedType} */ ({
          type: 'record',
          key: toSourceBabelTS(typeArguments[0]),
          val: toSourceBabelTS(typeArguments[1]),
        });
      } else if (name === 'Object' && (!typeArguments || typeArguments?.length === 0)) {
        return {type: 'object', properties: {}};
      } else if (name === 'Map' && typeArguments?.length === 2) {
        const key = toSourceBabelTS(typeArguments[0]);
        const val = toSourceBabelTS(typeArguments[1]);
        return /** @type {ExpandedType} */ ({type: 'map', key, val});
      } else if (name === 'Array' && typeArguments?.length === 1) {
        const elementType = toSourceBabelTS(typeArguments[0]);
        return /** @type {ExpandedType} */ ({type: 'array', elementType});
      } else if (name === 'Promise' && typeArguments?.length === 1) {
        const elementType = toSourceBabelTS(typeArguments[0]);
        return /** @type {ExpandedType} */ ({type: 'promise', elementType});
      } else if (name === 'Set' && typeArguments?.length === 1) {
        const elementType = toSourceBabelTS(typeArguments[0]);
        return /** @type {ExpandedType} */ ({type: 'set', elementType});
      }
      // Parity with expandType(): generic references like ArrayLike<T>,
      // ReadonlyArray<T>, NodeListOf<T> or user typedefs like MyBox<T>.
      const args = typeArguments.map(toSourceBabelTS);
      return /** @type {ExpandedType} */ ({type: 'reference', name, args});
    }
    case 'TSStringKeyword':
      return 'string';
    case 'TSSymbolKeyword':
      return 'symbol';
    case 'TSNumberKeyword':
      return 'number';
    case 'TSIntersectionType':
      return /** @type {ExpandedType} */ ({
        type: 'intersection',
        members: node.types.map(toSourceBabelTS)
      });
    case 'TSTupleType':
      return /** @type {ExpandedType} */ ({
        type: 'tuple',
        elements: node.elementTypes.map(toSourceBabelTS)
      });
    case 'TSNamedTupleMember': {
      const nName = typeof node.label === 'string' ? node.label : node.label?.name;
      const nType = toSourceBabelTS(node.elementType);
      /** @type {import('./expandedType.js').ExpandTupleMemberNode} */
      const mem = {
        type: 'tupleMember',
        name: /** @type {string} */ (nName),
        elementType: /** @type {ExpandedType} */ (nType),
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
        /** @type {import('./expandedType.js').ExpandTupleMemberNode} */
        const mem = {
          type: 'tupleMember',
          name: /** @type {string} */ (nName),
          elementType: /** @type {ExpandedType} */ (toSourceBabelTS(inner.elementType)),
          dotDot: true,
        };
        return mem;
      }
      return /** @type {ExpandedType} */ ({type: 'rest', annotation: toSourceBabelTS(inner)});
    }
    case 'TSUnionType':
      return /** @type {ExpandedType} */ ({
        type: 'union',
        members: node.types.map(toSourceBabelTS)
      });
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
    case 'TSArrayType':
      return /** @type {ExpandedType} */ ({
        type: 'array',
        elementType: toSourceBabelTS(node.elementType)
      });
    case 'TSLiteralType':
      return toSourceBabelTS(node.literal);
    case 'TemplateLiteral': {
      const quasis = node.quasis.map(cookedQuasi);
      const types = (node.expressions ?? []).map(toSourceBabelTS);
      return /** @type {ExpandedType} */ ({type: 'templateLiteral', quasis, types});
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
    case 'TSTypeQuery':
      const argument = toSourceBabelTS(node.exprName);
      return /** @type {ExpandedType} */ ({type: 'typeof', argument});
    case 'TSConditionalType': {
      const checkType = toSourceBabelTS(node.checkType);
      const extendsType = toSourceBabelTS(node.extendsType);
      const trueType = toSourceBabelTS(node.trueType);
      const falseType = toSourceBabelTS(node.falseType);
      return /** @type {ExpandedType} */ ({type: 'condition', checkType, extendsType, trueType, falseType});
    }
    case 'TSIndexedAccessType': {
      const index = toSourceBabelTS(node.indexType);
      const object = toSourceBabelTS(node.objectType);
      return /** @type {ExpandedType} */ ({type: 'indexedAccess', index, object});
    }
    case 'TSMappedType': {
      const param = node.typeParameter;
      const nameNode = param?.name;
      const element = typeof nameNode === 'string' ? nameNode : toSourceBabelTS(nameNode);
      const iterable = toSourceBabelTS(param?.constraint);
      const result = toSourceBabelTS(node.typeAnnotation);
      /** @type {import('./expandedType.js').ExpandMappingNode} */
      const out = {
        type: 'mapping',
        iterable: /** @type {ExpandedType} */ (iterable),
        element: /** @type {string} */ (element),
        result: /** @type {ExpandedType} */ (result),
      };
      if (node.nameType) {
        out.nameType = toSourceBabelTS(node.nameType);
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
      /** @type {import('./expandedType.js').ExpandIndexSignatureNode[] | undefined} */
      let indexSignatures;
      for (const member of node.members ?? []) {
        if (member.type === 'TSIndexSignature') {
          indexSignatures = indexSignatures ?? [];
          const indexSignature = /** @type {import('./expandedType.js').ExpandIndexSignatureNode | undefined} */ (toSourceBabelTS(member));
          if (indexSignature !== undefined) {
            indexSignatures.push(indexSignature);
          }
        } else if (member.type === 'TSPropertySignature') {
          const name = toSourceBabelTS(member.key);
          /** @type {ExpandedType | undefined} */
          let type = toSourceBabelTS(member.typeAnnotation);
          if (member.optional && type !== undefined) {
            if (typeof type === 'object') /** @type {{optional?: boolean}} */ (type).optional = true;
            else type = /** @type {ExpandedType} */ ({type, optional: true});
          }
          if (member.readonly && type !== undefined) {
            if (typeof type === 'object') /** @type {{readonly?: boolean}} */ (type).readonly = true;
            else type = /** @type {ExpandedType} */ ({type, readonly: true});
          }
          if (typeof name === 'string' && type !== undefined) {
            properties[name] = type;
          }
        } else {
          console.warn('TSTypeLiteral: unhandled member', member.type);
        }
      }
      /** @type {import('./expandedType.js').ExpandObjectNode} */
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
      const indexType = toSourceBabelTS(node.typeAnnotation);
      const indexParameters = (node.parameters ?? []).map(toBabelIndexParameter);
      return /** @type {ExpandedType} */ ({type: 'indexSignature', indexType, indexParameters});
    }
    case 'TSTypeOperator':
      if (node.operator === 'readonly') {
        // readonly erased at runtime, same shape as the inner type.
        return toSourceBabelTS(node.typeAnnotation);
      }
      if (node.operator === 'keyof') {
        const keyofArg = toSourceBabelTS(node.typeAnnotation);
        return /** @type {ExpandedType} */ ({type: 'keyof', argument: keyofArg});
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
