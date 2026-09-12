import {parse      } from '@babel/parser';
import {Stringifier} from './Stringifier.js';
import {nodeChildren} from './nodeChildren.js';
import {nodeIsFunctionLike} from './nodeIsFunctionLike.js';
/** @typedef {import('@babel/types').Node} Node */
/**
 * Converts a Babel-TS type AST node into a JSDoc compatible type string,
 * e.g. `number`, `string[]`, `Map<string, number>` or `{a: number, b?: string}`.
 *
 * The produced strings are valid TypeScript types as well, so they can be fed
 * back into `expandType`/`parseJSDoc` of this very project.
 * @param {Node} node - The Babel-TS type node.
 * @returns {string} The JSDoc-compatible type string.
 */
function tsTypeToJSDoc(node) {
  if (!node) {
    return 'any';
  }
  switch (node.type) {
    case 'TSAnyKeyword': return 'any';
    case 'TSBigIntKeyword': return 'bigint';
    case 'TSBooleanKeyword': return 'boolean';
    case 'TSNeverKeyword': return 'never';
    case 'TSNullKeyword': return 'null';
    case 'TSNumberKeyword': return 'number';
    case 'TSObjectKeyword': return 'object';
    case 'TSStringKeyword': return 'string';
    case 'TSSymbolKeyword': return 'symbol';
    case 'TSUndefinedKeyword': return 'undefined';
    case 'TSUnknownKeyword': return 'unknown';
    case 'TSVoidKeyword': return 'void';
    case 'TSThisType': return 'this';
    case 'TSIntrinsicKeyword': return 'intrinsic';
    case 'TSParenthesizedType':
      return '(' + tsTypeToJSDoc(node.typeAnnotation) + ')';
    case 'TSLiteralType':
      return literalToJSDoc(node.literal);
    case 'TSArrayType':
      return tsTypeToJSDoc(node.elementType) + '[]';
    case 'TSTupleType':
      return '[' + node.elementTypes.map(tsTypeToJSDoc).join(', ') + ']';
    case 'TSUnionType':
      return node.types.map(tsTypeToJSDoc).join('|');
    case 'TSIntersectionType':
      return node.types.map(tsTypeToJSDoc).join('&');
    case 'TSOptionalType':
      return tsTypeToJSDoc(node.typeAnnotation) + '?';
    case 'TSRestType':
      return '...' + tsTypeToJSDoc(node.typeAnnotation);
    case 'TSNamedTupleMember':
      return tsTypeToJSDoc(node.elementType);
    case 'TSTypeReference': {
      const name = simplifyReference(node.typeName);
      const params = node.typeParameters?.params;
      if (params?.length) {
        return `${name}<${params.map(tsTypeToJSDoc).join(', ')}>`;
      }
      return name;
    }
    case 'TSQualifiedName':
      return `${tsTypeToJSDoc(node.left)}.${tsTypeToJSDoc(node.right)}`;
    case 'TSExpressionWithTypeArguments':
      return simplifyReference(node.expression);
    case 'Identifier':
      return node.name;
    case 'TSTypeAnnotation':
      return tsTypeToJSDoc(node.typeAnnotation);
    case 'TSTypeQuery':
      return 'typeof ' + tsTypeToJSDoc(node.exprName);
    case 'TSTypeOperator':
      return node.operator + ' ' + tsTypeToJSDoc(node.typeAnnotation);
    case 'TSIndexedAccessType':
      return tsTypeToJSDoc(node.objectType) + '[' + tsTypeToJSDoc(node.indexType) + ']';
    case 'TSTypeLiteral':
      return typeLiteralMembersToJSDoc(node.members);
    case 'TSPropertySignature':
      return propertySignatureToJSDoc(node);
    case 'TSIndexSignature': {
      const {parameters, typeAnnotation} = node;
      const pad = parameters.length ? `${tsTypeToJSDoc(parameters[0].typeAnnotation)}` : 'any';
      return `[key: ${pad}]: ${tsTypeToJSDoc(typeAnnotation.typeAnnotation)}`;
    }
    case 'TSFunctionType':
      return functionSignatureToJSDoc(node);
    case 'TSConstructorType':
      return `new ${functionSignatureToJSDoc(node)}`;
    case 'TSCallSignatureDeclaration':
      return functionSignatureToJSDoc(node);
    case 'TSConstructSignatureDeclaration':
      return `new ${functionSignatureToJSDoc(node)}`;
    case 'TSTypePredicate':
      return `${tsTypeToJSDoc(node.parameterName)} is ${tsTypeToJSDoc(node.typeAnnotation)}`;
    case 'TSImportType': {
      const {argument, qualifier, typeArguments} = node;
      const arg = argument.type === 'StringLiteral' ? `'${jsImportSource(argument)}'` : tsTypeToJSDoc(argument);
      let out = 'import(' + arg + ')';
      if (qualifier) {
        out += '.' + tsTypeToJSDoc(qualifier);
      }
      if (typeArguments?.params?.length) {
        out += '<' + typeArguments.params.map(tsTypeToJSDoc).join(', ') + '>';
      }
      return out;
    }
    case 'TSMappedType': {
      const {typeParameter, typeAnnotation} = node;
      const name = tsTypeToJSDoc(typeParameter?.name);
      const constraint = typeParameter?.constraint ? ' in ' + tsTypeToJSDoc(typeParameter.constraint) : '';
      const optional = node.optional ? '?' : '';
      const value = typeAnnotation ? tsTypeToJSDoc(typeAnnotation) : 'any';
      return `{ [${name}${constraint}]${optional}: ${value} }`;
    }
    case 'TSConditionalType':
      return `${tsTypeToJSDoc(node.checkType)} extends ${tsTypeToJSDoc(node.extendsType)} ? ${tsTypeToJSDoc(node.trueType)} : ${tsTypeToJSDoc(node.falseType)}`;
    case 'TSTemplateLiteralType':
      return templateLiteralToJSDoc(node);
    default:
      console.warn('ts2js> tsTypeToJSDoc unhandled type', node.type, node);
      return 'any';
  }
}
/**
 * Reduces a possibly namespace-qualified type name to its local identifier,
 * e.g. `Validation.StringValidator` becomes `StringValidator`, since flattened
 * namespaces hoist their interfaces/classes to plain identifiers.
 * @param {Node} node - The referenced name node.
 * @returns {string} The simplified JSDoc type string.
 */
function simplifyReference(node) {
  if (node?.type === 'TSQualifiedName') {
    return simplifyReference(node.right);
  }
  return tsTypeToJSDoc(node);
}
/**
 * Converts a literal type node to its JSDoc representation.
 * @param {Node} literal - The literal node.
 * @returns {string} The JSDoc type string.
 */
function literalToJSDoc(literal) {
  if (literal.type === 'UnaryExpression') {
    return literal.operator + tsTypeToJSDoc(literal.argument);
  }
  if (literal.type === 'StringLiteral' || literal.type === 'NumericLiteral' || literal.type === 'BooleanLiteral') {
    return literal.extra?.raw ?? String(literal.value);
  }
  if (literal.type === 'BigIntLiteral') {
    return literal.extra?.raw ?? literal.value;
  }
  return tsTypeToJSDoc(literal);
}
/**
 * Converts a `TSTypeLiteral`'s members into a JSDoc object type string,
 * e.g. `{a: number, b?: string}`.
 * @param {Node[]} members - The members of the type literal.
 * @returns {string} The JSDoc object type string.
 */
function typeLiteralMembersToJSDoc(members) {
  const props = members.map(tsTypeToJSDoc);
  return '{' + props.join(', ') + '}';
}
/**
 * @param {Node} node - The `TSPropertySignature` node.
 * @returns {string} The `name: type` (or optional `name?: type`) string.
 */
function propertySignatureToJSDoc(node) {
  const key = tsTypeToJSDoc(node.key);
  const optional = node.optional ? '?' : '';
  const type = node.typeAnnotation ? tsTypeToJSDoc(node.typeAnnotation.typeAnnotation) : 'any';
  return `${key}${optional}: ${type}`;
}
/**
 * @param {Node} node - A function-like type node (`TSFunctionType`, `TSCallSignatureDeclaration`, ...).
 * @returns {string} The `(a: A) => R` style JSDoc type string.
 */
function functionSignatureToJSDoc(node) {
  const params = node.parameters
    .map(param => {
      const name = param.type === 'Identifier' ? param.name : '';
      const type = param.typeAnnotation ? tsTypeToJSDoc(param.typeAnnotation.typeAnnotation) : 'any';
      return name && name !== 'this' ? `${name}: ${type}` : type;
    })
    .join(', ');
  const retType = node.typeAnnotation ? tsTypeToJSDoc(node.typeAnnotation.typeAnnotation) : 'void';
  return `(${params}) => ${retType}`;
}
/**
 * @param {Node} node - The `TSTemplateLiteralType` node.
 * @returns {string} The template literal type as string.
 */
function templateLiteralToJSDoc(node) {
  const {quasis, types} = node;
  let out = '`';
  for (let i = 0; i < quasis.length; i++) {
    out += quasis[i].value.raw;
    if (types[i]) {
      out += '${' + tsTypeToJSDoc(types[i]) + '}';
    }
  }
  return out + '`';
}
/**
 * Extracts param information and produces a `@param` JSDoc line,
 * or nothing when nothing can be said about the parameter.
 * @param {Node} param - The parameter node.
 * @param {number} index - The index of the parameter.
 * @returns {string|undefined} The `@param` line.
 */
function paramToJSDoc(param, index) {
  if (param.type === 'TSParameterProperty') {
    param = param.parameter;
  }
  let type;
  let name;
  let optional = false;
  let rest = false;
  let defaultText;
  const typeAnnotationOf = value => value?.typeAnnotation?.typeAnnotation;
  if (param.type === 'Identifier') {
    name = param.name;
    optional = param.optional;
    type = typeAnnotationOf(param);
  } else if (param.type === 'AssignmentPattern') {
    optional = true;
    const left = param.left;
    if (left.type === 'Identifier') {
      name = left.name;
      type = typeAnnotationOf(left);
    } else {
      name = 'param' + index;
      if (left.id?.type === 'Identifier') {
        name = left.id.name;
      }
      type = typeAnnotationOf(left);
    }
    if (param.right?.type === 'StringLiteral' || param.right?.type === 'NumericLiteral' || param.right?.type === 'BooleanLiteral') {
      defaultText = param.right.extra?.raw ?? String(param.right.value);
    }
    if (!type) {
      type = inferTypeFromDefault(param.right);
    }
  } else if (param.type === 'RestElement') {
    rest = true;
    const argument = param.argument;
    if (argument.type === 'Identifier') {
      name = argument.name;
      type = typeAnnotationOf(param);
    } else {
      type = typeAnnotationOf(param);
      name = 'param' + index;
    }
  } else {
    // ObjectPattern / ArrayPattern
    name = 'param' + index;
    type = typeAnnotationOf(param);
  }
  let nameStr = name || ('param' + index);
  if (optional) {
    nameStr = '[' + nameStr + (defaultText !== undefined ? ' = ' + defaultText : '') + ']';
  }
  if (!type) {
    return `@param {any} ${nameStr}`;
  }
  const typeStr = rest ? '...' + restElementType(tsTypeToJSDoc(type)) : tsTypeToJSDoc(type);
  return `@param {${typeStr}} ${nameStr}`;
}
/**
 * Unwraps the trailing `[]` of an array type in a rest parameter context,
 * e.g. `@param {...string[]} rest` becomes `@param {...string} rest`.
 * @param {string} typeStr - The JSDoc type string.
 * @returns {string} The element type.
 */
function restElementType(typeStr) {
  if (typeStr.endsWith('[]')) {
    return typeStr.slice(0, -2);
  }
  return typeStr;
}
/**
 * Infers a JSDoc type from a default value literal.
 * @param {Node} node - The default value node.
 * @returns {import('@babel/types').Node|undefined} A primitive keyword node or `undefined`.
 */
function inferTypeFromDefault(node) {
  let keyword;
  switch (node?.type) {
    case 'StringLiteral': keyword = 'TSStringKeyword'; break;
    case 'NumericLiteral': keyword = 'TSNumberKeyword'; break;
    case 'BooleanLiteral': keyword = 'TSBooleanKeyword'; break;
    case 'NullLiteral': keyword = 'TSNullKeyword'; break;
    case 'ArrayExpression': keyword = 'TSArrayType'; break;
    default: return undefined;
  }
  return {type: keyword};
}
/**
 * @param {Node} node - The function-like node.
 * @returns {boolean} True if any parameter carries a type annotation.
 */
function hasTypedParams(node) {
  return node.params.some(param => {
    if (param.type === 'TSParameterProperty') {
      param = param.parameter;
    }
    return param.typeAnnotation || param.left?.typeAnnotation || param.argument?.typeAnnotation;
  });
}
/**
 * Returns the JSDoc lines for a function-like node.
 * @param {Node} node - The function-like node.
 * @returns {string[]} The JSDoc lines (without `@param`/`@returns` separators).
 */
function jsdocLinesFromFunction(node) {
  const lines = [];
  if (node.typeParameters?.params) {
    for (const tp of node.typeParameters.params) {
      const name = tp.name;
      lines.push(`@template {${name}} ${name}`);
    }
  }
  const addParams = node.type !== 'TSDeclareFunction' && node.kind !== 'get';
  if (addParams && hasTypedParams(node)) {
    node.params.forEach((param, i) => lines.push(paramToJSDoc(param, i)));
  }
  if (node.returnType?.typeAnnotation) {
    lines.push(`@returns {${tsTypeToJSDoc(node.returnType.typeAnnotation)}}`);
  }
  return lines;
}
/**
 * Injects `this.prop = prop;` statements for constructor parameter properties
 * (`constructor(public prop: number)`).
 * @param {import('@babel/types').ClassMethod|import('@babel/types').ClassPrivateMethod} node - The constructor node.
 */
function injectParameterProperties(node) {
  const body = node.body?.body;
  if (!Array.isArray(body)) {
    return;
  }
  const properties = node.params.filter(param => param.type === 'TSParameterProperty');
  for (const property of properties) {
    const parameter = property.parameter;
    if (parameter.type !== 'Identifier' && parameter.type !== 'AssignmentPattern') {
      console.warn('ts2js> unhandled parameter property', property);
      continue;
    }
    const target = parameter.type === 'AssignmentPattern' ? parameter.left : parameter;
    if (target.type !== 'Identifier') {
      console.warn('ts2js> unhandled parameter property target', property);
      continue;
    }
    const {name} = target;
    const alreadyAssigned = body.some(stmt => {
      if (stmt.type !== 'ExpressionStatement') return false;
      const expr = stmt.expression;
      return expr.type === 'AssignmentExpression' &&
        expr.operator === '=' &&
        expr.left.type === 'MemberExpression' &&
        expr.left.object.type === 'ThisExpression' &&
        expr.left.property.type === 'Identifier' &&
        expr.left.property.name === name;
    });
    if (alreadyAssigned) {
      continue;
    }
    const rightNode = target;
    const assignment = {
      type: 'ExpressionStatement',
      expression: {
        type: 'AssignmentExpression',
        operator: '=',
        left: {
          type: 'MemberExpression',
          object: {type: 'ThisExpression'},
          property: {type: 'Identifier', name},
          computed: false,
          optional: null,
        },
        right: rightNode,
      },
    };
    body.unshift(assignment);
  }
}
/**
 * A Stringifier subclass which strips TypeScript-only syntax while emitting the
 * JSDoc comments that were attached during the `annotate` pre-pass.
 */
class ToJS extends Stringifier {
  // --- Unwrap type-only expressions ---
  TSAsExpression(node) {
    return this.toSource(node.expression);
  }
  TSNonNullExpression(node) {
    return this.toSource(node.expression);
  }
  TSSatisfiesExpression(node) {
    return this.toSource(node.expression);
  }
  TSTypeAssertion(node) {
    return this.toSource(node.expression);
  }
  TSInstantiationExpression(node) {
    return this.toSource(node.expression);
  }
  TSTypeCastExpression(node) {
    return this.toSource(node.expression);
  }
  TSParameterProperty(node) {
    return this.toSource(node.parameter);
  }
  TSExpressionWithTypeArguments(node) {
    return this.toSource(node.expression);
  }
  TSImportEqualsDeclaration(node) {
    if (node.moduleReference?.type !== 'TSExternalModuleReference') {
      return '';
    }
    const name = this.toSource(node.id);
    const raw = jsImportSource(node.moduleReference.expression);
    if (node.importKind === 'type') {
      return `/** @import * as ${name} from '${raw}' */`;
    }
    return `import * as ${name} from '${raw}';`;
  }
  TSExportAssignment() {
    return '';
  }
  TSUndefinedKeyword() {
    return '';
  }
  // --- Drop type-only declarations, but keep interfaces/aliases as @typedef ---
  /**
   * @param {import('@babel/types').TSInterfaceDeclaration} node - The Babel AST node.
   * @returns {string} A JSDoc typedef comment.
   */
  TSInterfaceDeclaration(node) {
    return this.typedefComment(node);
  }
  /**
   * @param {import('@babel/types').TSTypeAliasDeclaration} node - The Babel AST node.
   * @returns {string} A JSDoc typedef comment.
   */
  TSTypeAliasDeclaration(node) {
    return this.typedefComment(node);
  }
  /**
   * Drop ambient declarations, they have no runtime representation.
   * @returns {string} An empty string.
   */
  TSDeclareFunction() {
    return '';
  }
  /**
   * Converts a namespace (`namespace X { ... }`) into the classic IIFE
   * pattern, exporting members via `X.member = member` assignments.
   * @param {import('@babel/types').TSModuleDeclaration} node - The namespace declaration.
   * @returns {string} The IIFE source.
   */
  TSModuleDeclaration(node) {
    const {id, body} = node;
    const name = id?.type === 'Identifier' ? id.name : '';
    if (!name || node.declare || node.global || !body || body.type !== 'TSModuleBlock') {
      return '';
    }
    const saved = this.numSpaces;
    const level = this.namespaceLevel ?? 0;
    this.namespaceLevel = level + 1;
    this.numSpaces = 0;
    const memberSource = this.namespaceMembers(body, name);
    this.numSpaces = saved;
    this.namespaceLevel = level;
    const spaces = this.spaces;
    const outer = '  '.repeat(level + 1);
    const inner = memberSource
      .replace(/ \*\/ +(?=[a-zA-Z_$])/g, '*/\n')
      .split('\n')
      .map(line => (line.trim() ? outer + line.trimEnd() : line))
      .join('\n');
    let out = spaces + `var ${name};\n`;
    out += spaces + `(function (${name}) {\n`;
    out += inner;
    out += '\n' + spaces + `})(${name} || (${name} = {}));`;
    return out;
  }
  /**
   * Renders the statements of a namespace body at base indentation, emitting
   * the local members and the trailing `Name.member = member;` assignments
   * for exported value members.
   * @param {import('@babel/types').TSModuleBlock} block - The namespace body.
   * @param {string} name - The namespace identifier.
   * @returns {string} The body source (joinable lines).
   */
  namespaceMembers(block, name) {
    const lines = [];
    const assignments = [];
    for (const statement of block.body) {
      if (statement.type === 'ExportNamedDeclaration') {
        const {code, names} = this.namespaceExport(statement);
        if (code) {
          lines.push(code.trimEnd());
        }
        for (const member of names) {
          assignments.push(`${name}.${member} = ${member};`);
        }
      } else {
        lines.push(this.toSource(statement).trimEnd());
      }
    }
    return lines.concat(assignments).join('\n');
  }
  /**
   * Renders an `export` statement inside a namespace: the declaration without
   * the `export` keyword and the list of exported value names.
   * @param {import('@babel/types').ExportNamedDeclaration} statement - The export statement.
   * @returns {{code: string, names: string[]}} The declaration source and exported names.
   */
  namespaceExport(statement) {
    const {declaration} = statement;
    if (!declaration) {
      return {code: '', names: []};
    }
    let names = [];
    switch (declaration.type) {
      case 'ClassDeclaration':
      case 'FunctionDeclaration':
      case 'TSEnumDeclaration':
        if (declaration.id) {
          names = [declaration.id.name];
        }
        break;
      case 'VariableDeclaration':
        names = declaration.declarations
          .map(declarator => declarator.id)
          .filter(id => id && id.type === 'Identifier')
          .map(id => id.name);
        break;
      case 'TSModuleDeclaration':
        if (declaration.id?.name) {
          names = [declaration.id.name];
        }
        break;
      default:
        break;
    }
    return {code: this.toSource(declaration), names};
  }
  /**
   * Converts `enum` into a plain `const` object.
   * @param {import('@babel/types').TSEnumDeclaration} node - The Babel AST node.
   * @returns {string} The object literal.
   */
  TSEnumDeclaration(node) {
    const spaces = this.spaces;
    let running = 0;
    const entries = node.members.map(member => {
      const key = this.toSource(member.id);
      let value;
      if (member.initializer) {
        value = this.toSource(member.initializer);
        if (member.initializer.type === 'NumericLiteral') {
          running = member.initializer.value + 1;
        } else if (member.initializer.type === 'UnaryExpression') {
          const raw = member.initializer.extra?.raw;
          if (raw) {
            const n = Number(raw);
            running = Number.isNaN(n) ? running : n + 1;
          }
        }
      } else {
        value = String(running);
        running++;
      }
      return `${key}: ${value}`;
    });
    let out = spaces + 'const ' + this.toSource(node.id) + ' = {\n';
    this.numSpaces++;
    const innerSpaces = this.spaces;
    out += entries.map(_ => innerSpaces + _).join(',\n');
    this.numSpaces--;
    out += '\n' + spaces + '};';
    return out;
  }
  /**
   * Renders a typedef comment for interfaces/type aliases.
   * @param {Node} node - The declaration node.
   * @returns {string} The comment.
   */
  typedefComment(node) {
    const lines = this.typedefLines(node);
    return this.jsdocComment(lines);
  }
  /**
   * Builds `@typedef` JSDoc lines for a declaration node.
   * @param {Node} node - The declaration node.
   * @returns {string[]} The JSDoc lines.
   */
  typedefLines(node) {
    if (node.type === 'TSTypeAliasDeclaration') {
      const name = node.id.name;
      return [`@typedef {${tsTypeToJSDoc(node.typeAnnotation)}} ${name}`];
    }
    const name = node.id.name;
    const lines = [`@typedef {Object} ${name}`];
    for (const member of node.body?.body ?? []) {
      if (member.type === 'TSPropertySignature') {
        const propName = tsTypeToJSDoc(member.key);
        const optional = member.optional;
        const type = member.typeAnnotation ? tsTypeToJSDoc(member.typeAnnotation.typeAnnotation) : 'any';
        lines.push(`@property {${type}} ${optional ? '[' + propName + ']' : propName}`);
      } else if (member.type === 'TSMethodSignature') {
        const methodName = tsTypeToJSDoc(member.key);
        const optional = member.optional;
        const type = functionSignatureToJSDoc(member);
        lines.push(`@property {${type}} ${optional ? '[' + methodName + ']' : methodName}`);
      }
    }
    return lines;
  }
  /**
   * Builds a JSDoc comment block string with proper indentation.
   * @param {string[]} lines - The comment body lines (e.g. `@param {number} a`).
   * @returns {string} The comment string.
   */
  jsdocComment(lines) {
    const spaces = this.spaces;
    let out = spaces + '/**\n';
    for (const line of lines) {
      out += spaces + ' * ' + line + '\n';
    }
    out += spaces + ' */';
    return out;
  }
  /**
   * Converts type-only imports into `@import` JSDoc comments and keeps
   * the value imports of mixed imports (`import {Value, type AlsoType}`).
   * @override
   * @param {import('@babel/types').ImportDeclaration} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  ImportDeclaration(node) {
    const typeSpecifiers = node.specifiers.filter(_ => _.importKind === 'type');
    const valueSpecifiers = node.specifiers.filter(_ => _.importKind !== 'type');
    const fullyTypeOnly = node.importKind === 'type' || (typeSpecifiers.length && valueSpecifiers.length === 0);
    if (fullyTypeOnly) {
      return importTypeToJSDoc(node.specifiers, node.source);
    }
    let out = '';
    if (typeSpecifiers.length) {
      out = importTypeToJSDoc(typeSpecifiers, node.source);
    }
    if (valueSpecifiers.length) {
      const valueImport = super.ImportDeclaration({...node, importKind: 'value', specifiers: valueSpecifiers});
      out = out ? out + '\n' + valueImport : valueImport;
    }
    return out;
  }
  /**
   * Strips type-only exports and converts type declarations into typedef comments.
   * @override
   * @param {import('@babel/types').ExportNamedDeclaration} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  ExportNamedDeclaration(node) {
    if (node.exportKind === 'type') {
      if (node.declaration) {
        return this.toSource(node.declaration);
      }
      return '';
    }
    if (node.specifiers.some(_ => _.exportKind === 'type')) {
      const specifiers = node.specifiers.filter(_ => _.exportKind !== 'type');
      if (specifiers.length === 0) {
        return '';
      }
      return super.ExportNamedDeclaration({...node, specifiers});
    }
    return super.ExportNamedDeclaration(node);
  }
  /**
   * Strips the `declare` modifier from variable declarations.
   * @override
   * @param {import('@babel/types').VariableDeclaration} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  VariableDeclaration(node) {
    if (node.declare) {
      return '';
    }
    return super.VariableDeclaration({...node, declare: false});
  }
}
/**
 * Renders a JSDoc `@import` comment for type-only import specifiers,
 * e.g. `import type {OnlyType} from './types'` becomes the single line
 * `@import { OnlyType } from './types.js'` and carries the type
 * information without creating a runtime import.
 * @param {import('@babel/types').ImportSpecifier[]|import('@babel/types').ImportDefaultSpecifier[]|import('@babel/types').ImportNamespaceSpecifier[]} specifiers - The import specifiers.
 * @param {import('@babel/types').StringLiteral} source - The import source.
 * @returns {string} The `@import` JSDoc comment (or an empty string).
 */
function importTypeToJSDoc(specifiers, source) {
  const named = [];
  let defaultName;
  let namespaceName;
  for (const specifier of specifiers) {
    if (specifier.type === 'ImportSpecifier') {
      named.push(specifier.local?.name ?? specifier.imported?.name);
    } else if (specifier.type === 'ImportDefaultSpecifier') {
      defaultName = specifier.local?.name;
    } else if (specifier.type === 'ImportNamespaceSpecifier') {
      namespaceName = specifier.local?.name;
    }
  }
  const parts = [];
  if (defaultName) {
    parts.push(defaultName);
  }
  if (named.length) {
    parts.push('{ ' + named.join(', ') + ' }');
  }
  if (namespaceName) {
    parts.push('* as ' + namespaceName);
  }
  if (!parts.length) {
    return '';
  }
  return `/** @import ${parts.join(', ')} from '${jsImportSource(source)}' */`;
}
/**
 * Rewrites a TypeScript import specifier to its JavaScript counterpart,
 * e.g. `./types` becomes `./types.js`.
 * @param {import('@babel/types').StringLiteral} source - The import source.
 * @returns {string} The JavaScript module specifier.
 */
function jsImportSource(source) {
  const raw = source.value;
  if (!raw.startsWith('.') && !raw.startsWith('/')) {
    return raw;
  }
  if (/\.(ts|tsx|mts|cts)$/.test(raw)) {
    return raw.replace(/\.(ts|tsx|mts|cts)$/, '.js');
  }
  if (!/\.[a-zA-Z][a-zA-Z0-9]*$/.test(raw)) {
    return raw + '.js';
  }
  return raw;
}
/**
 * Attaches JSDoc comment blocks to the AST nodes which carry TypeScript types.
 * @param {Node} node - The node to annotate recursively.
 * @param {Node[]} parents - The current parent stack.
 */
function annotate(node, parents) {
  if (!node || typeof node !== 'object') {
    return;
  }
  parents.push(node);

  const {type} = node;
  if (nodeIsFunctionLike(node)) {
    if ((type === 'ClassMethod' || type === 'ClassPrivateMethod') && node.kind === 'constructor') {
      injectParameterProperties(node);
    }
    const lines = jsdocLinesFromFunction(node);
    if (lines.length) {
      attachComment(node, lines, parents);
    }
  } else if (type === 'ClassProperty' || type === 'ClassPrivateProperty') {
    if (node.typeAnnotation?.typeAnnotation && !node.declare) {
      attachComment(node, [`@type {${tsTypeToJSDoc(node.typeAnnotation.typeAnnotation)}}`], parents);
    }
  } else if (type === 'ClassDeclaration' || type === 'ClassExpression') {
    const interfaces = node.implements || [];
    if (interfaces?.length) {
      const lines = interfaces.map(imp => `@implements {${simplifyReference(imp.expression)}}`);
      attachComment(node, lines, parents);
    }
  } else if (type === 'VariableDeclaration' && !node.declare) {
    collectVariableTypeComments(node, parents);
  }
  // recurse into children based on the annotated keys
  const keys = nodeChildren[type];
  for (const key of keys ?? []) {
    const child = node[key];
    if (Array.isArray(child)) {
      for (const entry of child) {
        annotate(entry, parents);
      }
    } else if (child && typeof child === 'object' && child.type) {
      annotate(child, parents);
    }
  }
  parents.pop();
}
/**
 * Attaches a JSDoc comment (built from `lines`) to a suitable statement-level host node.
 * @param {Node} node - The annotated node.
 * @param {string[]} lines - The JSDoc lines.
 * @param {Node[]} parents - The parent stack.
 */
function attachComment(node, lines, parents) {
  let host = findCommentHost(node, parents);
  if (!host) {
    host = node;
  }
  const comment = makeComment(node, lines, parents);
  host.leadingComments = [...(host.leadingComments || []), comment];
}
/**
 * Finds the statement-ish node where a JSDoc comment should live.
 * For `const f = (a) => {}` the comment belongs on the VariableDeclaration,
 * for `export function f` it belongs on the ExportNamedDeclaration.
 * @param {Node} node - The function/property node.
 * @param {Node[]} parents - The parent stack.
 * @returns {Node} The host node.
 */
function findCommentHost(node, parents) {
  const index = parents.findLastIndex(_ => _ === node);
  const parent = parents[index - 1];
  if (parent?.type === 'ExportNamedDeclaration') {
    // Inside namespaces the export wrapper is consumed by the namespace
    // emitter, so the comment has to live on the declaration itself.
    if (parents[index - 2]?.type === 'TSModuleBlock') {
      return node;
    }
    return parent;
  }
  if (parent?.type === 'VariableDeclarator') {
    const grand = parents[index - 2];
    if (grand?.type === 'VariableDeclaration') {
      if (parents[index - 3]?.type === 'ExportNamedDeclaration') {
        return parents[index - 3];
      }
      return grand;
    }
  }
  if (parent?.type === 'ExpressionStatement') {
    return parent;
  }
  // Class-methods/properties and object-methods host the comment themselves.
  return node;
}
/**
 * Creates a Babel CommentBlock node with a fabricated `loc`.
 * The column is derived from the renderer indentation depth of the annotated
 * node (2 spaces per indenting ancestor) so that the comment aligns with the
 * `spaces` of the node's rendered position, independent of the original
 * (namespace-shifted) source column.
 * @param {Node} node - The annotated node.
 * @param {string[]} lines - The JSDoc lines.
 * @param {Node[]} parents - The parent stack.
 * @returns {import('@babel/types').CommentBlock} The comment node.
 */
function makeComment(node, lines, parents) {
  const value = '*\n * ' + lines.join('\n * ');
  const start = node.start ?? node.loc?.start?.index ?? 0;
  const startColumn = 2 * renderIndentDepth(node, parents);
  return {
    type: 'CommentBlock',
    value,
    loc: {
      start: {index: start, line: node.loc?.start?.line ?? 1, column: startColumn},
      end: {index: start, line: node.loc?.start?.line ?? 1, column: startColumn},
    },
  };
}
/**
 * Node types whose renderer increases the indentation level by one (`this.numSpaces++`).
 * @type {Set<string>}
 */
const indentingNodeTypes = new Set([
  'ClassDeclaration', 'ClassExpression', 'FunctionDeclaration', 'FunctionExpression',
  'ArrowFunctionExpression', 'ObjectMethod', 'ClassMethod', 'ClassPrivateMethod',
  'BlockStatement', 'IfStatement', 'ObjectExpression', 'ArrayExpression',
  'ObjectPattern', 'ParenthesizedExpression', 'JSXElement', 'JSXFragment',
  'TSEnumDeclaration',
]);
/**
 * Counts the renderer indentation levels that nest `node`, so comments can be
 * placed at the column the stringifier will use (`2` spaces per level).
 * @param {Node} node - The annotated node.
 * @param {Node[]} parents - The parent stack.
 * @returns {number} The indentation depth of the node.
 */
function renderIndentDepth(node, parents) {
  const index = parents.findLastIndex(_ => _ === node);
  let depth = 0;
  for (let i = index - 1; i >= 0; i--) {
    if (indentingNodeTypes.has(parents[i].type)) {
      depth++;
    }
  }
  return depth;
}
/**
 * Attaches `@type` comments for typed variable declarations.
 * @param {import('@babel/types').VariableDeclaration} node - The declaration node.
 * @param {Node[]} parents - The parent stack.
 */
function collectVariableTypeComments(node, parents) {
  for (const declarator of node.declarations) {
    const type = declarator.id?.typeAnnotation?.typeAnnotation;
    if (!type) {
      continue;
    }
    attachComment(node, [`@type {${tsTypeToJSDoc(type)}}`], parents);
    break; // only annotate once per declaration statement
  }
}
/**
 * A roundtrip between TypeScript code -> JavaScript code with JSDoc types.
 * @param {string} code - The TypeScript code.
 * @param {object} [options] - Options for the conversion.
 * @param {boolean} [options.filename] - Unused placeholder, kept for API symmetry.
 * @returns {string} The converted JavaScript code.
 */
function ts2js(code, options = {}) {
  const ast = parseTS(code);
  annotate(ast.program, []);
  const stringifier = new ToJS();
  const source = stringifier.toSource(ast);
  return formatCommentBreaks(stringifier.getHeader() + source);
}
/**
 * Moves a statement that follows a generated JSDoc block onto its own line,
 * e.g. a closing comment marker directly followed by `export function f() {}`
 * becomes the closing marker, a newline, then `export function f() {}`.
 * @param {string} source - The generated source code.
 * @returns {string} The source with fixed comment/statement breaks.
 */
function formatCommentBreaks(source) {
  return source.replace(/ \*\/ +(?=[a-zA-Z_$])/g, '*/\n');
}
/**
 * Parses TypeScript code, automatically falling back to TSX (JSX) mode
 * when the input contains JSX elements.
 * @param {string} code - The TypeScript code.
 * @returns {import('@babel/parser').ParseResult<import('@babel/types').File>} The parsed AST.
 */
function parseTS(code) {
  try {
    return parse(code, {sourceType: 'module', plugins: ['typescript']});
  } catch (e) {
    return parse(code, {sourceType: 'module', plugins: [['typescript', {isTSX: true}], 'jsx']});
  }
}
export {ts2js, tsTypeToJSDoc, ToJS};

/**
 * @file
 * @todo Consider rendering nested namespaces leading flat, so their member
 * columns align with the source indentation.
 */
