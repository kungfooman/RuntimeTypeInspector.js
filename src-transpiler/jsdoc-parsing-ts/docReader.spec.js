import {canonicalDocEqual, canonicalDocCovers} from '../jsdoc-parsing-depfree/canonicalDocCompare.js';
import {docReaderDepFree} from '../jsdoc-parsing-depfree/docReaderDepFree.js';
import {docReaderTS} from './docReaderTS.js';

// Every delimited harness input strips to bare tag text, which is the
// readers' shared input shape. Delimiters stay at the call boundary:
// the TS reader wraps them for `createSourceFile`, the depfree reader
// never needs them.
const inputs = [
  '@param {number} x',
  '@param {number} a @param {string} b',
  '@template K @param {K} x',
  '@template [K=string]',
  '@param {Object} [kwargs={}] rest',
  '@param {string} outputs.logits The logits',
  '@param {number} *value',
  '@param {number a',
  '@param {number a @param {string} b',
  '@param {number} a\ncall foo(@param bar) here',
  '@type {number}',
  '@template {string} [K=string]',
  '@overload\n@param {string} text\n@returns {string}\n@overload\n@param {number} value\n@returns {number}',
  '@overload\n@param {number} [x]\n@param {number} [y]',
  '@overload\n@param {string} label\n@param {...number[]} values\n@returns {number}',
  '@overload\n@param {string} label\n@param {...number} values\n@returns {number}',
  '@template {string} T @overload\n@param {T} first\n@param {NoInfer<T>} second\n@returns {T}',
  '@overload\n@param {...number[]} [values]\n@returns {number}',
  '@overload\n@param {number[]} ...values\n@returns {number}',
  '@overload\n@param {string} text\n@returns {string}\n@param {string|number} value\n@returns {string|number}',
  '@template K @template V @param {K} a @param {V} b',
  '@param {string} url\n@param {object} options Opts.\n@param {number} [options.maxRetries] Max.\n@param {boolean} [options.json] Flag.',
  '@callback SwapFunction\n@param {Object} newState - The new state.',
  '@overload\n@param {string} label\n@param {...number[][]} values\n@returns {number}',
  '@overload\n@param {string} label\n@param {...number[][]} [values]\n@returns {number}',
];

// One function per input would be 25 near-identical functions; the loop
// keeps the matrix in data while the label names the failing cell, so a
// failure line still points at what broke. The parity harness runs the
// same inputs delimited; this spec runs them bare.
function testReadersAgreeOnInputs() {
  for (const input of inputs) {
    const actual = docReaderDepFree(input);
    const expected = docReaderTS(input);
    if (!canonicalDocEqual(actual, expected) && !canonicalDocCovers(actual, expected)) {
      console.warn('docReader> mismatch for input ' + JSON.stringify(input), {actual, expected});
      return false;
    }
  }
  return true;
}

export const tests = [testReadersAgreeOnInputs];
