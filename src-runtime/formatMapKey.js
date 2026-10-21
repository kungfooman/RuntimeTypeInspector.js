import {describeValueType} from "./describeValue.js";
/**
 * Short display form of a `Map` key for `.get(key)` paths and labels:
 * strings stay readable (`'apiKey'`), anything else falls back to a
 * depth-capped one-liner. Never throws.
 * @param {*} key - The map key.
 * @returns {string} Key label.
 * @example
 * formatMapKey('apiKey'); // "'apiKey'"
 */
function formatMapKey(key) {
  if (typeof key === 'string') {
    return `'${key.replace(/'/g, "\\'")}'`;
  }
  // Primitives render directly; the describeValue walk only pays off for
  // object-like keys, and `Map<number, T>` scales into the tens of
  // thousands of entries on hot paths where this label is failure-only.
  if (key === null || typeof key === 'number' || typeof key === 'boolean' || typeof key === 'symbol') {
    return String(key);
  }
  try {
    const text = describeValueType(key, 1);
    return text.length > 60 ? `${text.slice(0, 57)}...` : text;
  } catch {
    return '?';
  }
}
export {formatMapKey};
