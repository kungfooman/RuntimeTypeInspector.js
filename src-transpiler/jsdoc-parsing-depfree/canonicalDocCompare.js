import {canonicalize} from '../../src-runtime/canonicalize.js';
/**
 * Structural compare of two canonical documents: key-sorted,
 * absent-vs-false blind, arrays ordered.
 * @example
 * const emptyActual = {templates: [], overloads: []};
 * const emptyExpected = {templates: [], overloads: []};
 * canonicalDocEqual(emptyActual, emptyExpected); // true
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
 * Containers live in flat rows and inside callback entries; both walk
 * the same way.
 * @example
 * const emptyActual = {templates: [], overloads: []};
 * const emptyExpected = {templates: [], overloads: []};
 * canonicalDocCovers(emptyActual, emptyExpected); // true
 * @param {import('./canonicalDoc.js').CanonicalDoc} actual - Depfree document.
 * @param {import('./canonicalDoc.js').CanonicalDoc} expected - TS document.
 * @returns {boolean} True when coverage holds both ways.
 */
function canonicalDocCovers(actual, expected) {
  const actualTemplates = JSON.stringify(canonicalize(actual.templates));
  const expectedTemplates = JSON.stringify(canonicalize(expected.templates));
  const sameTemplates = actualTemplates === expectedTemplates;
  const returnsMatch = actual.returns === expected.returns;
  const overloadsMatch = actual.overloads.length === expected.overloads.length;
  const shapesMatch = overloadsMatch && actual.callbacks.length === expected.callbacks.length;
  if (sameTemplates === false || returnsMatch === false || shapesMatch === false) {
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
        const sameName = param !== undefined && param.name === tsRow.name;
        const sameBrackets = param !== undefined && param.bracketed === tsRow.bracketed;
        if (sameName === false || sameBrackets === false) {
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
  const callbackCovers = (entry, index) => {
    const expectedEntry = expected.callbacks[index];
    return entry.name === expectedEntry.name && walk(entry.params, expectedEntry.params);
  };
  if (actual.callbacks.some((entry, index) => callbackCovers(entry, index) === false)) {
    return false;
  }
  const signatureCovers = (signature, index) => {
    return walk(signature.params, expected.overloads[index].params);
  };
  return actual.overloads.every(signatureCovers);
}
export {canonicalDocEqual, canonicalDocCovers};
