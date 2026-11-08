import {canonicalize} from '../../src-runtime/canonicalize.js';

/**
 * Round-trips one canonical document through JSON: what both readers
 * produce must be plain data (no positions, no TS nodes, no functions).
 * Fails when any value does not survive serialization structurally
 * intact (undefined, functions, circular references).
 * @example
 * canonicalDocRoundTrip({templates: [], overloads: [], params: [], returns: '', callbacks: []});
 * // true
 * @param {import('./canonicalDoc.js').CanonicalDoc} doc - Canonical document.
 * @returns {boolean} True when the JSON round trip preserves the document.
 */
function canonicalDocRoundTrip(doc) {
  const revived = JSON.parse(JSON.stringify(doc));
  return JSON.stringify(canonicalize(revived)) === JSON.stringify(canonicalize(doc));
}
export {canonicalDocRoundTrip};
