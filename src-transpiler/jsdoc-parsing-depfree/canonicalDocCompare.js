import {canonicalize} from '../../src-runtime/canonicalize.js';

/**
 * Structural compare of two canonical documents: key-sorted,
 * absent-vs-false blind, arrays ordered.
 * @example
 * canonicalDocEqual({templates: [], overloads: [], params: [], returns: '', callbacks: []}, {templates: [], overloads: [], params: [], returns: '', callbacks: []});
 * // true
 * @param {import('./canonicalDoc.js').CanonicalDoc} actual - First document.
 * @param {import('./canonicalDoc.js').CanonicalDoc} expected - Second document.
 * @returns {boolean} True when structurally identical.
 */
function canonicalDocEqual(actual, expected) {
  return JSON.stringify(canonicalize(actual)) === JSON.stringify(canonicalize(expected));
}

/**
 * Coverage check for the granularity difference: TS absorbs dotted
 * sub-params into their container (the container carries `merged: true`
 * with no usable type text) while the depfree side keeps the written
 * brace text. Both sides list the container plus its re-sliced children
 * in source order, so the check walks row by row: merged containers
 * match on name and brackets only (type text and the flag are the
 * documented difference), every other row matches whole. Any breakage
 * (wrong sub-row name, lost row, bracket flip) fails the check.
 * @example
 * canonicalDocCovers({templates: [], overloads: [], params: [], returns: '', callbacks: []}, {templates: [], overloads: [], params: [], returns: '', callbacks: []});
 * // true
 * @param {import('./canonicalDoc.js').CanonicalDoc} actual - Depfree document.
 * @param {import('./canonicalDoc.js').CanonicalDoc} expected - TS document.
 * @returns {boolean} True when coverage holds both ways.
 */
function canonicalDocCovers(actual, expected) {
  if (
    JSON.stringify(canonicalize(actual.templates)) !== JSON.stringify(canonicalize(expected.templates)) ||
    JSON.stringify(canonicalize(actual.callbacks)) !== JSON.stringify(canonicalize(expected.callbacks)) ||
    actual.returns !== expected.returns ||
    actual.overloads.length !== expected.overloads.length
  ) {
    return false;
  }
  const walk = (actualParams, expectedParams) => {
    if (actualParams.length !== expectedParams.length) {
      return false;
    }
    for (let index = 0; index < expectedParams.length; index += 1) {
      const param = actualParams[index];
      const tsRow = expectedParams[index];
      if (tsRow.merged === true) {
        if (param === undefined || param.name !== tsRow.name || param.bracketed !== tsRow.bracketed) {
          return false;
        }
        continue;
      }
      if (param === undefined) {
        return false;
      }
      if (JSON.stringify(canonicalize(param)) !== JSON.stringify(canonicalize(tsRow))) {
        return false;
      }
    }
    return true;
  };
  if (!walk(actual.params, expected.params)) {
    return false;
  }
  return actual.overloads.every((signature, index) => walk(signature.params, expected.overloads[index].params));
}
export {canonicalDocEqual, canonicalDocCovers};
