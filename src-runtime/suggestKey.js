import {editDistance} from "./editDistance.js";
/**
 * Closest allowed key to a mistyped value, if close enough to suggest.
 * @param {string} value - The actual (wrong) key.
 * @param {string[]} keys - Allowed keys.
 * @returns {string|undefined} Suggestion or undefined.
 * @example
 * suggestKey('camra', ['camera', 'light']); // 'camera'
 */
function suggestKey(value, keys) {
  if (typeof value !== 'string' || !keys.length) {
    return;
  }
  let best;
  for (const key of keys) {
    const dist = editDistance(value, key);
    if (best === undefined || dist < best.dist) {
      best = {key, dist};
    }
  }
  if (best && best.dist <= Math.max(1, Math.floor(best.key.length / 3))) {
    return best.key;
  }
}
export {suggestKey};
