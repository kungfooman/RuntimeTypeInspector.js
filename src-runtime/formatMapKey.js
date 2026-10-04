import {describeValueType} from "./describeValue.js";
/**
 * Short display form of a `Map` key for `.get(…)` paths and labels:
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
  try {
    const text = describeValueType(key, 1);
    return text.length > 60 ? `${text.slice(0, 57)}...` : text;
  } catch {
    return '?';
  }
}
export {formatMapKey};
