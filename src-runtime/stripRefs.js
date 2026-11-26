/**
 * Strips live `ref` bindings from an expect tree for messaging: functions
 * do not survive `structuredClone`/`postMessage`, so a posted envelope
 * carrying a `ref` would throw `DataCloneError` (swallowed by bestEffort
 * into a silently lost report). Validation already ran on the live tree;
 * the panel only needs names, which stay. Plain data passes by value, so
 * callers keep their (possibly frozen) tree untouched. Cycles cannot
 * occur in emitted trees, but a `seen` guard fails closed regardless.
 * @param {*} expect - The expect tree (possibly holding `ref` bindings).
 * @param {Set<object>} [seen] - Nodes on the current path (cycle guard).
 * @returns {*} A clone without `ref` keys, or the input when ref-free.
 * @example
 * stripRefs({type: 'reference', name: 'Vec', ref: Vec}); // {type: 'reference', name: 'Vec'}
 * stripRefs('number'); // 'number'
 */
function stripRefs(expect, seen) {
  if (expect === null || typeof expect !== 'object') {
    return expect;
  }
  if (typeof expect === 'function') {
    return undefined;
  }
  const known = seen ?? new Set();
  if (known.has(expect)) {
    return expect;
  }
  known.add(expect);
  let changed = false;
  let out;
  if (Array.isArray(expect)) {
    out = new Array(expect.length);
    for (let i = 0; i < expect.length; i++) {
      const item = stripRefs(expect[i], known);
      out[i] = item;
      if (item !== expect[i]) {
        changed = true;
      }
    }
    known.delete(expect);
    return changed ? out : expect;
  }
  out = {};
  for (const key of Object.keys(expect)) {
    if (key === 'ref') {
      changed = true;
      continue;
    }
    /** @type {Record<string, any>} */
    const writable = out;
    /** @type {Record<string, any>} */
    const readable = expect;
    const cleaned = stripRefs(readable[key], known);
    writable[key] = cleaned;
    if (cleaned !== readable[key]) {
      changed = true;
    }
  }
  known.delete(expect);
  return changed ? out : expect;
}
export {stripRefs};
