/**
 * Canonical cache key for a generic type argument: JSON-like but precise
 * where JSON is lossy (`-0` vs `+0`, `NaN`/`±Infinity` vs `null`,
 * `undefined` vs missing). Object keys sort so insertion order never splits
 * a hit. Cycles and non-plain objects (class instances, Maps, Dates, ...)
 * have no stable content spelling and yield undefined, so callers skip the
 * cache instead of sharing wrongly. Type trees from the pipeline are finite
 * plain data by construction (the same invariant `substituteType` relies
 * on); the guard is belt-and-braces for anything else. The path set is
 * added to on descend and removed on return, so shared (non-cyclic)
 * subtrees still key instead of tripping the guard.
 * @param {*} value - A type argument (type tree or literal).
 * @param {Set<object>} [seen] - Nodes on the current path (cycle guard).
 * @returns {string|undefined} Stable key, or undefined when unserializable.
 * @example
 * canonicalKey(['"a"', 1]); // ["\"a\"",1]
 * canonicalKey(-0); // "-0"
 */
function canonicalKey(value, seen) {
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
    if (value === Infinity) {
      return 'Infinity';
    }
    if (value === -Infinity) {
      return '-Infinity';
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
  if (typeof value !== 'object') {
    return undefined;
  }
  const known = seen ?? new Set();
  if (known.has(value)) {
    return undefined;
  }
  known.add(value);
  let key;
  if (Array.isArray(value)) {
    const parts = [];
    for (const item of value) {
      const part = canonicalKey(item, known);
      if (part === undefined) {
        return undefined;
      }
      parts.push(part);
    }
    key = `[${parts.join(',')}]`;
  } else {
    if (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) {
      return undefined;
    }
    const parts = [];
    for (const k of Object.keys(value).sort()) {
      const part = canonicalKey(value[k], known);
      if (part === undefined) {
        return undefined;
      }
      parts.push(`${JSON.stringify(k)}:${part}`);
    }
    key = `{${parts.join(',')}}`;
  }
  known.delete(value);
  return key;
}
export {canonicalKey};
