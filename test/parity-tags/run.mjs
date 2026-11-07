/**
 * Tag-parity oracle: the TypeScript compiler's own JSDoc tags as the
 * reference for the tag layer.
 *
 * Both sides lower to one JSON schema and deep-compare structurally
 * (key-sorted via `canonicalize`, never string comparison): the flat
 * `getJSDocTags` API hides structure, so the oracle descends into
 * `JSDocSignature` nodes for `@overload` sections, and the pipeline side
 * splits sections first so each section's rows stay with their own
 * signature. Where the two deliberately diverge, the divergence is data
 * in the schema (`dropped`, `merged`), not a harness special-case: a
 * stale divergence fails the run instead of rotting silently.
 *
 * The pipeline exists to lower the same shapes dep-free (and for the
 * runtime enforcement tsc never does). Runs as its own script so it never
 * leaks the TS dependency into the dep-free suite:
 *
 *   node test/parity-tags/run.mjs
 */
import ts from 'typescript';
import {canonicalize} from '../../src-runtime/canonicalize.js';
import {parseJSDocNodes} from '../../src-transpiler/parseJSDocNodes.js';
import {parseJSDocDocument} from '../../src-transpiler/parseJSDocDocument.js';
import {makeParamTag} from '../../src-transpiler/makeParamTag.js';
import {splitOverloadSections} from '../../src-transpiler/splitOverloadSections.js';

/**
 * Canonical JSDoc document schema. Both sides produce this shape; the
 * compare is structural, so field order and absent-vs-false flags never
 * matter:
 *
 *   {templates: [{name, constraint, default}], overloads: [{params:
 *   [{name, bracketed, type, dropped}], returns}], params: [{...}],
 *   returns: {type} | undefined, callbacks: [{name, params}]}
 *
 * `dropped` marks rows the fold binds nothing for (misplaced rest,
 * empty names): the tag shape still agrees, the binding does not, and
 * the flag says so in data. `merged` marks rows tsc folds into a
 * container (dotted sub-params, callback params): the pipeline keeps the
 * rows, the oracle nests them, and the flag says so in data. The oracle
 * container type after dotted rows is unreliable at tag level (the
 * parser absorbs trailing rows as type text), so merged containers
 * compare names and brackets only, never type text.
 * @typedef {object} CanonicalDoc
 * @property {{name: string, constraint: string, default: string}[]} templates - Template bindings in order.
 * @property {{params: {name: string, bracketed: boolean, type: string, dropped: boolean}[], returns: string}[]} overloads - One entry per `@overload` section.
 * @property {{name: string, bracketed: boolean, type: string, dropped: boolean, merged: boolean}[]} params - Flat rows (implementation signature or plain comment).
 * @property {string} returns - Flat return brace text (empty when absent).
 * @property {{name: string, params: {name: string, bracketed: boolean, type: string, dropped: boolean, merged: boolean}[]}[]} callbacks - Callback signatures.
 */

/**
 * Reads one oracle parameter (flat or inside a signature). `dropped`
 * means "binds nothing here", decided from tsc's own evidence: a
 * leading-`...` name is the TS1003/TS8032 rejection, and an empty name
 * (stray furniture like `*value`) matches no parameter. Both agree with
 * the pipeline's invalidRest/empty-name decline.
 * @param {object} tag - TS JSDoc parameter tag.
 * @returns {{name: string, bracketed: boolean, type: string, dropped: boolean, merged: boolean}} Canonical parameter.
 */
function tsParam(tag) {
  const raw = tag.name ? tag.name.getText() : '';
  const name = raw.split(/\s+/)[0].split('=')[0] ?? '';
  return {
    name,
    bracketed: tag.isBracketed === true,
    type: tag.typeExpression ? tag.typeExpression.getText().replace(/^\{/, '').replace(/\}$/, '') : '',
    dropped: name === '' || name.startsWith('...'),
    // `true` when the parser absorbed trailing rows as type text (the
    // dotted-sub-param signal); set by the caller, never by the tag.
    merged: false,
  };
}

/**
 * Reads one `@template` tag: binding name from `typeParameters`, plus the
 * braced constraint and `= default` split out of the binding text.
 * @param {object} tag - TS JSDoc template tag.
 * @returns {{name: string, constraint: string, default: string}} Canonical template.
 */
function tsTemplate(tag) {
  const binding = (tag.typeParameters ?? [])[0]?.getText() ?? '';
  const match = binding.match(/^\[([A-Za-z_$][\w$]*)(?:=(.*))?\]$/);
  if (match) {
    return {name: match[1], constraint: tag.constraint ? tag.constraint.getText().replace(/^\{/, '').replace(/\}$/, '') : '', default: (match[2] ?? '').trim()};
  }
  return {name: binding, constraint: tag.constraint ? tag.constraint.getText().replace(/^\{/, '').replace(/\}$/, '') : '', default: ''};
}

/**
 * Lowers one comment through the TS compiler to the canonical schema.
 * One entry per `@overload` marker: TS emits one `JSDocOverloadTag` per
 * marker, each with its own signature, exactly like the pipeline's
 * per-section split. No merging anywhere.
 * @param {string} comment - JSDoc comment text including `/** *\/`.
 * @returns {CanonicalDoc} Canonical oracle document.
 */
function tsDoc(comment) {
  const source = ts.createSourceFile('parity.ts', comment + '\nfunction __f() {}', ts.ScriptTarget.Latest, true);
  const fn = source.statements[0];
  /** @type {CanonicalDoc} */
  const doc = {templates: [], overloads: [], params: [], returns: '', callbacks: []};
  for (const tag of ts.getJSDocTags(fn) ?? []) {
    if (tag.kind === ts.SyntaxKind.JSDocOverloadTag) {
      const signature = tag.typeExpression;
      const params = (signature.parameters ?? []).map((parameter) => tsParam(parameter));
      const returns = signature.type && signature.type.kind === ts.SyntaxKind.JSDocReturnTag && signature.type.typeExpression
        ? signature.type.typeExpression.getText().replace(/^\{/, '').replace(/\}$/, '')
        : '';
      doc.overloads.push({params, returns});
      continue;
    }
    if (tag.kind === ts.SyntaxKind.JSDocTemplateTag) {
      doc.templates.push(tsTemplate(tag));
      continue;
    }
    if (tag.kind === ts.SyntaxKind.JSDocParameterTag) {
      doc.params.push(tsParam(tag));
      continue;
    }
    if (tag.kind === ts.SyntaxKind.JSDocReturnTag || tag.kind === ts.SyntaxKind.JSDocReturnTag) {
      doc.returns = tag.typeExpression ? tag.typeExpression.getText().replace(/^\{/, '').replace(/\}$/, '') : '';
      continue;
    }
    if (tag.kind === ts.SyntaxKind.JSDocCallbackTag) {
      // Callback params nest in the signature; the schema carries them
      // as a callback entry with the same parameter shape, so nesting
      // compares as data instead of a harness special-case.
      const signature = tag.typeExpression;
      doc.callbacks.push({
        name: tag.fullName?.getText() ?? '',
        params: (signature.parameters ?? []).map((parameter) => tsParam(parameter)),
      });
      continue;
    }
    if (tag.kind === ts.SyntaxKind.JSDocTypeTag) {
      doc.returns = tag.typeExpression ? tag.typeExpression.getText().replace(/^\{/, '').replace(/\}$/, '') : '';
    }
  }
  // Dotted sub-params resolve into the container on the TS side: the
  // container row carries the absorbed text as its type, and the rows
  // themselves never surface as tags. Mark the container merged so the
  // merge check excuses its type text and expects the sub-rows on the
  // pipeline side instead.
  const merged = [];
  for (const param of doc.params) {
    if (param.type.includes('@param')) {
      merged.push({...param, type: '', merged: true});
      continue;
    }
    merged.push(param);
  }
  doc.params = merged;
  return doc;
}

/**
 * Lowers one pipeline tag to a canonical parameter. The name is the
 * validated bind name (empty when the tag binds nothing, like tsc's
 * empty name): raw head text is diagnostics, not parity business.
 * @param {{name: string, optional: boolean, invalidRest: boolean, typeRaw: string}} tag - Raw pipeline tag.
 * @param {string} typeRaw - Brace text (tag's own, for flat rows).
 * @returns {{name: string, bracketed: boolean, type: string, dropped: boolean, merged: boolean}} Canonical parameter.
 */
function rtiParam(tag, typeRaw) {
  return {
    name: tag.name.split(/\s+/)[0].split('=')[0] ?? '',
    bracketed: tag.optional === true,
    type: typeRaw,
    dropped: tag.invalidRest === true || tag.name === '',
    merged: false,
  };
}

/**
 * Lowers one comment through the pipeline to the canonical schema.
 * @param {string} comment - JSDoc comment text including `/** *\/`.
 * @returns {CanonicalDoc} Canonical pipeline document.
 */
function rtiDoc(comment) {
  /** @type {CanonicalDoc} */
  const doc = {templates: [], overloads: [], params: [], returns: '', callbacks: []};
  const sections = splitOverloadSections([comment]);
  if (sections.overloads.length > 0) {
    for (const node of parseJSDocNodes(comment)) {
      if (node.tag === '@template') {
        const head = node.headRaw.trim().split(/\s+/)[0] ?? '';
        const match = head.match(/^\[([A-Za-z_$][\w$]*)(?:=(.*))?\]$/);
        doc.templates.push(match
          ? {name: match[1], constraint: node.typeRaw, default: (match[2] ?? '').trim()}
          : {name: head, constraint: node.typeRaw, default: ''});
      }
    }
    for (const section of sections.overloads) {
      const sectionDoc = parseJSDocDocument(section);
      const params = (sectionDoc.tags ?? []).map((tag) => rtiParam(tag, tag.typeRaw));
      const returns = section.match(/@returns?\s*\{([^}]*)\}/)?.[1] ?? '';
      doc.overloads.push({params, returns});
    }
    if (sections.impl !== undefined && sections.impl !== null && sections.impl !== '') {
      for (const node of parseJSDocNodes(sections.impl)) {
        if (node.tag === '@param') {
          doc.params.push(rtiParam(makeParamTag(node.typeRaw, node.headRaw), node.typeRaw));
        } else if (node.tag === '@returns' || node.tag === '@return') {
          doc.returns = sections.impl.match(/@returns?\s*\{([^}]*)\}/)?.[1] ?? '';
        }
      }
    }
    return doc;
  }
  for (const node of parseJSDocNodes(comment)) {
    if (node.tag === '@param') {
      doc.params.push(rtiParam(makeParamTag(node.typeRaw, node.headRaw), node.typeRaw));
    } else if (node.tag === '@template') {
      const head = node.headRaw.trim().split(/\s+/)[0] ?? '';
      const match = head.match(/^\[([A-Za-z_$][\w$]*)(?:=(.*))?\]$/);
      doc.templates.push(match
        ? {name: match[1], constraint: node.typeRaw, default: (match[2] ?? '').trim()}
        : {name: head, constraint: node.typeRaw, default: ''});
    } else if (node.tag === '@returns' || node.tag === '@return') {
      doc.returns = node.typeRaw;
    } else if (node.tag === '@type') {
      doc.returns = node.typeRaw;
    } else if (node.tag === '@callback') {
      // Callback rows follow as flat `@param` tags; they group under the
      // callback name, mirroring the oracle's nested signature.
      const name = node.headRaw.split(/\s+/)[0] ?? '';
      const entry = {name, params: []};
      doc.callbacks.push(entry);
      const rows = parseJSDocNodes(comment);
      const start = rows.findIndex((row) => row.tag === '@callback' && row.headRaw === node.headRaw);
      for (const row of rows.slice(start + 1)) {
        if (row.tag !== '@param') {
          break;
        }
        entry.params.push(rtiParam(makeParamTag(row.typeRaw, row.headRaw), row.typeRaw));
      }
    }
  }
  // Callback rows group under their callback; they never count as flat
  // implementation rows. Dotted rows stay flat on the pipeline side (the
  // fold needs them); the `merged` flag on the oracle side records where
  // tsc nests them.
  const callbackNames = new Set(doc.callbacks.flatMap((entry) => entry.params.map((param) => param.name)));
  doc.params = doc.params.filter((param) => !callbackNames.has(param.name));
  return doc;
}

/**
 * Structural compare: key-sorted, absent-vs-false blind, arrays ordered.
 * @param {*} actual - Pipeline document.
 * @param {*} expected - Oracle document.
 * @returns {boolean} True when structurally identical.
 */
function docsEqual(actual, expected) {
  return JSON.stringify(canonicalize(actual)) === JSON.stringify(canonicalize(expected));
}

/**
 * Coverage proof for granularity differences: TS absorbs dotted
 * sub-params into their container (the container carries `merged: true`
 * with no usable type text) while the pipeline keeps every row for the
 * fold. Parity here is coverage, not row equality: every oracle row has
 * a pipeline counterpart with the same name and brackets, and every
 * pipeline row is either an oracle row or a dotted child of a merged
 * container, in order. Any breakage (wrong sub-row name, lost row,
 * bracket flip) fails the walk and reports drift.
 * @param {CanonicalDoc} actual - Pipeline document.
 * @param {CanonicalDoc} expected - Oracle document.
 * @returns {boolean} True when coverage holds both ways.
 */
function coversBothWays(actual, expected) {
  if (
    JSON.stringify(canonicalize(actual.templates)) !== JSON.stringify(canonicalize(expected.templates)) ||
    JSON.stringify(canonicalize(actual.callbacks)) !== JSON.stringify(canonicalize(expected.callbacks)) ||
    actual.returns !== expected.returns ||
    actual.overloads.length !== expected.overloads.length
  ) {
    return false;
  }
  const walk = (actualParams, expectedParams) => {
    let offset = 0;
    for (const oracle of expectedParams) {
      if (oracle.merged === true) {
        // Container row: name and brackets agree; the flag and the
        // unusable type text are the documented granularity difference.
        const param = actualParams[offset];
        if (param === undefined || param.name !== oracle.name || param.bracketed !== oracle.bracketed) {
          return false;
        }
        offset += 1;
        // Sub-rows follow on the pipeline side in order, each a dotted
        // child carrying its own brackets and type.
        while (offset < actualParams.length && actualParams[offset].name.startsWith(oracle.name + '.')) {
          const sub = actualParams[offset];
          if (sub.dropped === true) {
            return false;
          }
          offset += 1;
        }
        continue;
      }
      const param = actualParams[offset];
      if (param === undefined) {
        return false;
      }
      if (JSON.stringify(canonicalize(param)) !== JSON.stringify(canonicalize(oracle))) {
        return false;
      }
      offset += 1;
    }
    return offset === actualParams.length;
  };
  if (!walk(actual.params, expected.params)) {
    return false;
  }
  return actual.overloads.every((signature, index) => walk(signature.params, expected.overloads[index].params));
}

const cases = [
  {comment: '/** @param {number} x */'},
  {comment: '/** @param {number} a @param {string} b */'},
  {comment: '/** @template K @param {K} x */'},
  {comment: '/** @template [K=string] */'},
  {comment: '/** @param {Object} [kwargs={}] rest */'},
  {comment: '/** @param {string} outputs.logits The logits */'},
  // TS binds the stray `*` head as an empty name; the pipeline binds
  // nothing. Same observable params, same `dropped` verdict.
  {comment: '/** @param {number} *value */'},
  // Recovery matches: TS closes the brace at the comment end and binds
  // the head word; the pipeline splits type from head the same way, and a
  // following tag still opens its own row.
  {comment: '/** @param {number a */'},
  {comment: '/** @param {number a @param {string} b */'},
  {comment: '/** @param {number} a\n * call foo(@param bar) here */'},
  {comment: '/** @type {number} */'},
  {comment: '/** @template {string} [K=string] */'},
  // Overload sections descend into signatures on both sides now: each
  // section's params (names, brackets, brace text) and return type agree.
  {comment: '/**\n * @overload\n * @param {string} text\n * @returns {string}\n * @overload\n * @param {number} value\n * @returns {number}\n */'},
  {comment: '/**\n * @overload\n * @param {number} [x]\n * @param {number} [y]\n */'},
  // Rest matrix from the #320 work: variadic spellings agree as raw tags,
  // and the drop/never decisions ride the `dropped` flag, not prose.
  {comment: '/**\n * @overload\n * @param {string} label\n * @param {...number[]} values\n * @returns {number}\n */'},
  {comment: '/**\n * @overload\n * @param {string} label\n * @param {...number} values\n * @returns {number}\n */'},
  // Template rows with constraints and defaults.
  {comment: '/** @template {string} T @overload\n * @param {T} first\n * @param {NoInfer<T>} second\n * @returns {T}\n */'},
  // Optional rest (`[...]`): the bracket flag agrees; lowering to never
  // is the expander's decision, pinned by the rest fixture, not the tags.
  {comment: '/**\n * @overload\n * @param {...number[]} [values]\n * @returns {number}\n */'},
  // Misplaced rest (`{T} ...name`): the `dropped` flag agrees; the drop
  // itself is the documented TS1003/TS8032 parity.
  {comment: '/**\n * @overload\n * @param {number[]} ...values\n * @returns {number}\n */'},
  // Overload plus implementation rows: the sections plus the flat
  // trailing rows agree on both sides.
  {comment: '/**\n * @overload\n * @param {string} text\n * @returns {string}\n * @param {string|number} value\n * @returns {string|number}\n */'},
  // Multiple bare templates bind in order.
  {comment: '/** @template K @template V @param {K} a @param {V} b */'},
  // Dotted sub-params: TS resolves them into the container while the
  // pipeline keeps every row for the fold. Parity is coverage (every
  // oracle row matched, every pipeline row an oracle row or a dotted
  // child), proved by the walk, not by row equality.
  {comment: '/**\n * @param {string} url\n * @param {object} options Opts.\n * @param {number} [options.maxRetries] Max.\n * @param {boolean} [options.json] Flag.\n */'},
  // Callbacks nest params in the signature on both sides now (the schema
  // carries them as callback entries), so they compare whole.
  {comment: '/**\n * @callback SwapFunction\n * @param {Object} newState - The new state.\n */'},
];

// Hostile matrix: every rest/optional spelling crossed with every nesting
// level, generated from the #320 accept/reject verdicts. Each cell states
// the tsc verdict inline; the schema compare pins that both sides read
// the same shape, and the jsdoc-expect fixtures pin the runtime behavior.
const restTypes = ['...number[]', '...number', '...number[][]'];
const restNames = ['values', '[values]'];
const matrix = [];
for (const type of restTypes) {
  for (const name of restNames) {
    matrix.push('/**\n * @overload\n * @param {string} label\n * @param {' + type + '} ' + name + '\n * @returns {number}\n */');
  }
}
matrix.push('/**\n * @overload\n * @param {number[]} ...values\n * @returns {number}\n */');

let failures = 0;
function check(comment) {
  const expected = tsDoc(comment);
  const actual = rtiDoc(comment);
  if (docsEqual(actual, expected)) {
    console.log('SAME ', JSON.stringify(comment.slice(0, 80)));
    return;
  }
  if (coversBothWays(actual, expected)) {
    // Same coverage at different granularity (merged containers): parity
    // holds by proof, not by row equality. Any breakage in the walk
    // reports drift above instead of landing here.
    console.log('SAME ', JSON.stringify(comment.slice(0, 80)), '(covered: container + sub-rows)');
    return;
  }
  failures += 1;
  console.log('DRIFT', JSON.stringify(comment.slice(0, 80)));
  console.log('  ts :', JSON.stringify(expected));
  console.log('  rti:', JSON.stringify(actual));
}
for (const {comment} of cases) {
  check(comment);
}
for (const comment of matrix) {
  check(comment);
}

if (failures > 0) {
  console.log('parity-tags: ' + failures + ' drift(s)');
  process.exit(1);
}
console.log('parity-tags: all agree');
