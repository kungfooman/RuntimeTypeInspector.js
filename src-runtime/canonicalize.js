/**
 * Canonicalizes a type for structural comparison: sorted keys, `false`
 * flags normalized to absent (both mean the same in RTI semantics).
 * @param {*} type - The type.
 * @returns {*} Canonical form safe for JSON comparison.
 * @example
 * canonicalize({b: 1, a: 2, optional: false}); // {a: 2, b: 1}
 */
function canonicalize(type) {
  if (Array.isArray(type)) {
    return type.map(canonicalize);
  }
  if (type && typeof type === 'object') {
    const out = {};
    for (const key of Object.keys(type).sort()) {
      const value = type[key];
      if (value === undefined) {
        continue;
      }
      if ((key === 'optional' || key === 'readonly') && value === false) {
        continue;
      }
      out[key] = canonicalize(value);
    }
    return out;
  }
  return type;
}
export {canonicalize};
