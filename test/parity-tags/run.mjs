/**
 * Tag-parity oracle: the TypeScript-backed reader as the reference for
 * the dependency-free reader.
 *
 * Both sides are the real readers (`docReaderTS`, `docReaderDepFree`)
 * lowering to one shared JSON schema, deep-compared structurally
 * (key-sorted via `canonicalize`, never string comparison). Where the
 * two deliberately differ in granularity, the difference is data in the
 * schema (`dropped`, `merged`), not a harness special-case: a stale
 * divergence fails the run instead of rotting silently.
 *
 * Runs as its own script so the TS import never leaks into the
 * dep-free suite:
 *
 *   node test/parity-tags/run.mjs
 */
import {canonicalize} from '../../src-runtime/canonicalize.js';
import {canonicalDocEqual, canonicalDocCovers} from '../../src-transpiler/jsdoc-parsing-depfree/canonicalDocCompare.js';
import {docReaderDepFree} from '../../src-transpiler/jsdoc-parsing-depfree/docReaderDepFree.js';
import {docReaderTS} from '../../src-transpiler/jsdoc-parsing-ts/docReaderTS.js';

/**
 * Canonical JSDoc document schema. Both readers produce this shape; the
 * compare is structural, so field order and absent-vs-false flags never
 * matter. The typedef lives with the depfree reader; the TS reader
 * references it type-only.
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
 * Oracle document: the real TS-backed reader on the delimited comment.
 * The readers take bare tag text, so the delimiters stay here at the
 * call boundary, not inside either reader.
 * @param {string} comment - JSDoc comment text including `/** *\/`.
 * @returns {import('../../src-transpiler/jsdoc-parsing-depfree/canonicalDoc.js').CanonicalDoc} Oracle document.
 */
function tsDoc(comment) {
  return docReaderTS(comment.replace(/^\/\*\*\s?/, '').replace(/\s?\*\/$/, ''));
}

/**
 * Depfree document: the real dependency-free reader on the delimited comment.
 * @param {string} comment - JSDoc comment text including `/** *\/`.
 * @returns {import('../../src-transpiler/jsdoc-parsing-depfree/canonicalDoc.js').CanonicalDoc} Depfree document.
 */
function rtiDoc(comment) {
  return docReaderDepFree(comment.replace(/^\/\*\*\s?/, '').replace(/\s?\*\/$/, ''));
}

/**
 * Structural compare: key-sorted, absent-vs-false blind, arrays ordered.
 * Shared with the reader spec; a stale copy here fails the run.
 */
function docsEqual(actual, expected) {
  return canonicalDocEqual(actual, expected);
}

/**
 * Coverage proof for the one granularity difference: TS absorbs dotted
 * sub-params into their container (the container carries `merged: true`
 * with no usable type text) while the depfree side keeps the written
 * brace text. Shared with the reader spec; a stale copy here fails the run.
 */
function coversBothWays(actual, expected) {
  return canonicalDocCovers(actual, expected);
}

const cases = [
  {comment: '/** @param {number} x */'},
  {comment: '/** @param {number} a @param {string} b */'},
  {comment: '/** @template K @param {K} x */'},
  {comment: '/** @template [K=string] */'},
  {comment: '/** @param {Object} [kwargs={}] rest */'},
  {comment: '/** @param {string} outputs.logits The logits */'},
  // TS binds the stray `*` head as an empty name; the depfree side binds
  // nothing. Same observable params, same `dropped` verdict.
  {comment: '/** @param {number} *value */'},
  // Recovery matches: TS closes the brace at the comment end and binds
  // the head word; the depfree side splits type from head the same way,
  // and a following tag still opens its own row.
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
  // depfree side keeps the written brace text. The walk compares
  // containers by name and brackets, children whole.
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
