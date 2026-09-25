import {extractCurlyContent} from './parseJSDocTypedef.js';
import {parseJSDoc} from './parseJSDoc.js';
import {inferTypeFromDefault} from './inferTypeFromDefault.js';
// Declaration-site ranks: the field always beats constructor assignments,
// like TSC where the declared type wins over assigned values.
const FIELD_JSDOC = 3;
const CTOR_JSDOC = 2;
const FIELD_INFER = 1;
const CTOR_INFER = 0;
/**
 * Reads the last block comment attached to a node.
 * @param {*} node - Babel AST node.
 * @returns {string|undefined} Comment text or undefined.
 */
function lastBlockComment(node) {
  const list = node?.leadingComments;
  if (!list) {
    return;
  }
  for (let i = list.length - 1; i >= 0; i--) {
    if (list[i].type === 'CommentBlock') {
      return list[i].value;
    }
  }
}
/**
 * Extracts a `{...}`-typed JSDoc tag (`@type`, `@returns`) from a comment.
 * @param {string|undefined} comment - Comment text.
 * @param {string} tag - Tag name including `@`.
 * @param {Function} expandType - String type to structured type.
 * @returns {{type: *, raw: string}|undefined} Expanded type plus raw text.
 */
function tagType(comment, tag, expandType) {
  if (!comment) {
    return;
  }
  const idx = comment.search(new RegExp(`${tag}(?=[\\s{])`));
  if (idx === -1) {
    return;
  }
  const slice = comment.slice(idx);
  if (!slice.includes('{')) {
    return;
  }
  try {
    const {content} = extractCurlyContent(slice);
    if (!content || !content.trim()) {
      return;
    }
    return {type: expandType(content.trim()), raw: content.trim()};
  } catch {
    // Unparseable annotation: fail open, harvest continues.
  }
}
/**
 * Reads a static property name: identifiers and string literals, including
 * computed `['name']` forms. Anything dynamic yields undefined.
 * @param {*} key - Babel key node.
 * @param {boolean} computed - Whether the key position is computed.
 * @returns {string|undefined} Property name or undefined.
 */
function keyName(key, computed) {
  if (!key) {
    return;
  }
  if (key.type === 'Identifier' && !computed) {
    return key.name;
  }
  if (key.type === 'StringLiteral') {
    return key.value;
  }
}
/**
 * Unwraps parenthesized and TS `as`/`satisfies` nodes.
 * @param {*} node - Babel AST node.
 * @returns {*} Unwrapped node.
 */
function unwrap(node) {
  while (node && (node.type === 'ParenthesizedExpression' || node.type === 'TSAsExpression' || node.type === 'TSSatisfiesExpression')) {
    node = node.expression;
  }
  return node;
}
/**
 * Merges a harvested entry: higher rank wins the type, flags accumulate
 * (`optional` reflects runtime reality, `@readonly` anywhere counts).
 * Two disagreeing humans (JSDoc vs JSDoc) warn, like a TSC error.
 * @param {Record<string, object>} fields - Collected entries by name.
 * @param {string} name - Property name.
 * @param {object} entry - Entry with type, rank, raw, readonly, optional.
 * @param {Function} warn - Transpile-time warning function.
 * @param {string} className - Class name for messages.
 */
function record(fields, name, entry, warn, className) {
  const existing = fields[name];
  if (!existing) {
    fields[name] = entry;
    return;
  }
  if (entry.jsdoc && existing.jsdoc && entry.raw !== existing.raw) {
    warn(`harvestClassShape: ${className}.${name} has conflicting JSDoc types (${existing.raw} vs ${entry.raw})`);
  }
  const winner = entry.rank >= existing.rank ? entry : existing;
  winner.readonly = existing.readonly || entry.readonly;
  winner.optional = existing.optional || entry.optional;
  fields[name] = winner;
}
/**
 * Turns a collected entry into a type struct, applying flags.
 * @param {object} entry - Collected entry.
 * @returns {*} Type struct or name.
 */
function entryToType(entry) {
  const t = entry.type ?? 'any';
  if (!entry.readonly && !entry.optional) {
    return t;
  }
  if (t && typeof t === 'object') {
    return {...t, ...(entry.readonly ? {readonly: true} : {}), ...(entry.optional ? {optional: true} : {})};
  }
  const out = {type: t};
  if (entry.readonly) {
    out.readonly = true;
  }
  if (entry.optional) {
    out.optional = true;
  }
  return out;
}
/**
 * Records `this.x = ...` (or `+=`, `++`) assignments.
 * @param {*} left - Assignment target.
 * @param {*} right - Assigned value or undefined for op-assign/update.
 * @param {string|undefined} comment - Leading comment text.
 * @param {boolean} conditional - True inside conditionals (counts as optional).
 * @param {object} ctx - Harvest context with fields, expandType, warn, className.
 */
function recordThisAssign(left, right, comment, conditional, ctx) {
  const {fields, expandType, warn, className} = ctx;
  left = unwrap(left);
  if (!left || left.type !== 'MemberExpression' || left.computed) {
    return;
  }
  if (!left.object || left.object.type !== 'ThisExpression') {
    return;
  }
  const name = keyName(left.property, false);
  if (name === undefined) {
    return;
  }
  const declared = tagType(comment, '@type', expandType);
  if (right === undefined) {
    // Op-assign/update (`+=`, `++`): exists, type unknown.
    record(fields, name, {type: 'any', rank: CTOR_INFER, jsdoc: false, optional: conditional}, warn, className);
    return;
  }
  const inferred = inferTypeFromDefault(unwrap(right));
  const type = declared?.type ?? inferred;
  if (type === undefined) {
    return;
  }
  record(fields, name, {
    type,
    rank: declared ? CTOR_JSDOC : CTOR_INFER,
    jsdoc: declared !== undefined,
    raw: declared?.raw,
    optional: conditional,
  }, warn, className);
}
/**
 * Handles `Object.assign(this, {...})` with inline object literals.
 * @param {*} node - CallExpression node.
 * @param {boolean} conditional - True inside conditionals.
 * @param {object} ctx - Harvest context.
 * @returns {boolean} True when the call was `Object.assign` on `this`.
 */
function recordObjectAssign(node, conditional, ctx) {
  const {fields, expandType, warn, className} = ctx;
  const {callee, arguments: args} = node;
  if (!callee || callee.type !== 'MemberExpression' || callee.computed) {
    return false;
  }
  if (callee.object?.type !== 'Identifier' || callee.object.name !== 'Object') {
    return false;
  }
  if (callee.property?.type !== 'Identifier' || callee.property.name !== 'assign') {
    return false;
  }
  if (!args.length || args[0].type !== 'ThisExpression') {
    return false;
  }
  for (const arg of args.slice(1)) {
    if (!arg || arg.type !== 'ObjectExpression') {
      continue;
    }
    for (const prop of arg.properties) {
      if (!prop || prop.type !== 'ObjectProperty') {
        continue;
      }
      const name = keyName(prop.key, prop.computed);
      if (name === undefined) {
        continue;
      }
      const comment = lastBlockComment(prop);
      const declared = tagType(comment, '@type', expandType);
      const type = declared?.type ?? inferTypeFromDefault(unwrap(prop.value));
      if (type === undefined) {
        continue;
      }
      record(fields, name, {
        type,
        rank: declared ? CTOR_JSDOC : CTOR_INFER,
        jsdoc: declared !== undefined,
        raw: declared?.raw,
        optional: conditional,
      }, warn, className);
    }
  }
  return true;
}
/**
 * Walks an expression for `this.x` writes. Stops at function boundaries:
 * deferred writes (callbacks) are out of scope.
 * @param {*} expr - Babel expression node.
 * @param {boolean} conditional - True inside conditionals.
 * @param {object} ctx - Harvest context.
 * @param {*} stmt - Enclosing statement carrying leading comments.
 */
function walkExpression(expr, conditional, ctx, stmt) {
  if (!expr) {
    return;
  }
  switch (expr.type) {
    case 'AssignmentExpression': {
      const comment = lastBlockComment(stmt);
      if (expr.operator === '=') {
        recordThisAssign(expr.left, expr.right, comment, conditional, ctx);
        walkExpression(expr.right, conditional, ctx, stmt);
      } else {
        recordThisAssign(expr.left, undefined, comment, conditional, ctx);
      }
      break;
    }
    case 'UpdateExpression':
      recordThisAssign(expr.argument, undefined, lastBlockComment(stmt), conditional, ctx);
      break;
    case 'SequenceExpression':
      for (const each of expr.expressions) {
        walkExpression(each, conditional, ctx, stmt);
      }
      break;
    case 'LogicalExpression':
      walkExpression(expr.right, true, ctx, stmt);
      break;
    case 'ConditionalExpression':
      walkExpression(expr.consequent, true, ctx, stmt);
      walkExpression(expr.alternate, true, ctx, stmt);
      break;
    case 'CallExpression':
      recordObjectAssign(expr, conditional, ctx);
      break;
  }
}
/**
 * Walks a statement for `this.x` writes. Conditional wrappers mark entries
 * optional; nested functions are boundaries.
 * @param {*} st - Babel statement node.
 * @param {boolean} conditional - True inside conditionals.
 * @param {object} ctx - Harvest context.
 */
function walkStatement(st, conditional, ctx) {
  if (!st) {
    return;
  }
  switch (st.type) {
    case 'BlockStatement':
      for (const each of st.body) {
        walkStatement(each, conditional, ctx);
      }
      break;
    case 'ExpressionStatement':
      walkExpression(st.expression, conditional, ctx, st);
      break;
    case 'ReturnStatement':
      walkExpression(st.argument, conditional, ctx, st);
      break;
    case 'IfStatement':
      walkStatement(st.consequent, true, ctx);
      walkStatement(st.alternate, true, ctx);
      break;
    case 'WhileStatement':
    case 'ForStatement':
    case 'ForInStatement':
    case 'ForOfStatement':
      walkStatement(st.body, true, ctx);
      break;
    case 'DoWhileStatement':
      walkStatement(st.body, conditional, ctx);
      break;
    case 'SwitchStatement':
      for (const each of st.cases) {
        for (const consequent of each.consequent) {
          walkStatement(consequent, true, ctx);
        }
      }
      break;
    case 'TryStatement':
      walkStatement(st.block, conditional, ctx);
      if (st.handler) {
        walkStatement(st.handler.body, true, ctx);
      }
      if (st.finalizer) {
        walkStatement(st.finalizer, conditional, ctx);
      }
      break;
    case 'LabeledStatement':
      walkStatement(st.body, conditional, ctx);
      break;
  }
}
/**
 * Reads the single parameter name of a setter.
 * @param {*} param - Babel parameter node.
 * @returns {string|undefined} Name or undefined.
 */
function setterParamName(param) {
  if (!param) {
    return;
  }
  if (param.type === 'Identifier') {
    return param.name;
  }
  if (param.type === 'AssignmentPattern' && param.left.type === 'Identifier') {
    return param.left.name;
  }
}
/**
 * Reads a setter's value type: its `@param` JSDoc first, `@type` fallback.
 * @param {*} set - Babel ClassMethod (kind set) node.
 * @param {Function} expandType - String type to structured type.
 * @returns {{type: *, raw: string|undefined, jsdoc: boolean}} Type plus metadata.
 */
function setterType(set, expandType) {
  const setComment = lastBlockComment(set);
  const paramName = setterParamName(set.params[0]);
  const params = parseJSDoc(setComment ?? '', expandType);
  if (paramName && params && params[paramName] !== undefined) {
    return {type: params[paramName], raw: undefined, jsdoc: true};
  }
  const tagged = tagType(setComment, '@type', expandType);
  if (tagged) {
    return {type: tagged.type, raw: tagged.raw, jsdoc: true};
  }
  return {type: 'any', raw: undefined, jsdoc: false};
}
/**
 * Harvests the instance shape of a class: field declarations (JSDoc wins,
 * else inferred), constructor `this.x` writes (field site wins conflicts),
 * methods as `Function`, getter/setter pairs as writable and getter-only as
 * readonly. Statics, privates and dynamic keys are skipped.
 * @param {*} node - Babel ClassDeclaration node.
 * @param {object} opts - Options with expandType and warn.
 * @param {Function} opts.expandType - String type to structured type.
 * @param {Function} opts.warn - Transpile-time warning function.
 * @returns {{name: string, shape: object}|undefined} Class name plus object shape.
 */
function harvestClassShape(node, {expandType, warn}) {
  const id = node?.id;
  if (!id || id.type !== 'Identifier' || !id.name) {
    return;
  }
  const className = id.name;
  const ctx = {fields: {}, gets: {}, sets: {}, expandType, warn, className};
  let ctor = null;
  for (const el of node.body.body) {
    if (el.type === 'ClassPrivateProperty' || el.type === 'ClassPrivateMethod') {
      continue;
    }
    const name = keyName(el.key, el.computed);
    if (name === undefined) {
      continue;
    }
    if (el.type === 'ClassProperty' || el.type === 'PropertyDefinition') {
      if (el.static || el.declare) {
        continue;
      }
      const comment = lastBlockComment(el);
      const declared = tagType(comment, '@type', expandType);
      const inferred = el.value ? inferTypeFromDefault(unwrap(el.value)) : undefined;
      const type = declared?.type ?? inferred;
      if (type === undefined) {
        continue;
      }
      record(ctx.fields, name, {
        type,
        rank: declared ? FIELD_JSDOC : FIELD_INFER,
        jsdoc: declared !== undefined,
        raw: declared?.raw,
        readonly: el.readonly === true || (comment ? /@readonly(?![\w])/.test(comment) : false),
        optional: el.optional === true,
      }, warn, className);
    } else if (el.type === 'ClassMethod' || el.type === 'ClassPrivateMethod') {
      if (el.static) {
        continue;
      }
      if (el.kind === 'constructor') {
        ctor = el;
      } else if (el.kind === 'method') {
        ctx.fields[name] = ctx.fields[name] ?? {type: 'Function', rank: FIELD_INFER, jsdoc: false};
      } else if (el.kind === 'get') {
        ctx.gets[name] = el;
      } else if (el.kind === 'set') {
        ctx.sets[name] = el;
      }
    }
  }
  for (const name of Object.keys(ctx.gets)) {
    const get = ctx.gets[name];
    const set = ctx.sets[name];
    const getComment = lastBlockComment(get);
    const getType = tagType(getComment, '@type', expandType) ?? tagType(getComment, '@returns', expandType);
    const setInfo = set ? setterType(set, expandType) : undefined;
    const type = getType?.type ?? setInfo?.type ?? 'any';
    record(ctx.fields, name, {
      type,
      rank: (getType || setInfo?.jsdoc) ? FIELD_JSDOC : FIELD_INFER,
      jsdoc: Boolean(getType || setInfo?.jsdoc),
      raw: getType?.raw ?? setInfo?.raw,
      readonly: !set,
    }, warn, className);
  }
  for (const name of Object.keys(ctx.sets)) {
    if (ctx.gets[name]) {
      continue;
    }
    const setInfo = setterType(ctx.sets[name], expandType);
    record(ctx.fields, name, {
      type: setInfo.type,
      rank: setInfo.jsdoc ? FIELD_JSDOC : FIELD_INFER,
      jsdoc: setInfo.jsdoc,
      raw: setInfo.raw,
    }, warn, className);
  }
  if (ctor && ctor.body) {
    for (const st of ctor.body.body) {
      walkStatement(st, false, ctx);
    }
  }
  const properties = {};
  for (const name of Object.keys(ctx.fields)) {
    properties[name] = entryToType(ctx.fields[name]);
  }
  if (!Object.keys(properties).length) {
    return;
  }
  return {name: className, shape: {type: 'object', properties}};
}
export {harvestClassShape};
