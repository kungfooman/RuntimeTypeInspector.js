/**
 * Canonical cache key for a generic type argument: JSON-like but precise
 * where JSON is lossy (`-0` vs `+0`, `NaN` vs `null`, `undefined` vs
 * missing). Object keys sort so insertion order never splits a hit;
 * functions and symbols have no stable spelling and yield undefined so
 * callers skip the cache instead of sharing wrongly.
 * @param {*} value - A type argument (type tree or literal).
 * @returns {string|undefined} Stable key, or undefined when unserializable.
 * @example
 * canonicalKey(['"a"', 1]); // ["\"a\"",1]
 * canonicalKey(-0) !== canonicalKey(0); // true
 */
function canonicalKey(value) {
  if (value === undefined) {
    return 'undefined';
  }
  if (value === null) {
    return 'null';
  }
  if (typeof value === 'number') {
    if (Number.isNaN(value)) {
      return 'NaN';
    }
    if (Object.is(value, -0)) {
      return '-0';
    }
    return JSON.stringify(value);
  }
  if (typeof value === 'string' || typeof value === 'boolean') {
    return JSON.stringify(value);
  }
  if (typeof value === 'bigint') {
    return `bigint:${String(value)}`;
  }
  if (typeof value === 'function' || typeof value === 'symbol') {
    return undefined;
  }
  if (Array.isArray(value)) {
    const parts = [];
    for (const item of value) {
      const part = canonicalKey(item);
      if (part === undefined) {
        return undefined;
      }
      parts.push(part);
    }
    return `[${parts.join(',')}]`;
  }
  if (typeof value === 'object') {
    const parts = [];
    for (const key of Object.keys(value).sort()) {
      const part = canonicalKey(value[key]);
      if (part === undefined) {
        return undefined;
      }
      parts.push(`${JSON.stringify(key)}:${part}`);
    }
    return `{${parts.join(',')}}`;
  }
  return undefined;
}
export {canonicalKey};
