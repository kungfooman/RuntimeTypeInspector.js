/**
 * Shallow shape tag for a failed value: primitives by `typeof` (with `null`
 * split out, since it fails differently from objects), objects and functions
 * by constructor name. Deliberately cheap — no walks, so it can run on every
 * failure including hot-loop repeats — and deliberately coarse: same-shape
 * values (`'x'` then `'y'`) share a tag and keep ticking, while a mode
 * change (string then object) re-reports in full. Anything exotic (revoked
 * proxies, throwing getters) falls back to `'object'`.
 * @param {*} value - The failed value.
 * @returns {string} The shape tag.
 * @example
 * tagValue('x'); // 'string'
 * tagValue(new Map()); // 'Map'
 */
function tagValue(value) {
  if (value === null) {
    return 'null';
  }
  const t = typeof value;
  if (t !== 'object' && t !== 'function') {
    return t;
  }
  try {
    return value.constructor?.name || 'object';
  } catch {
    return 'object';
  }
}
export {tagValue};
