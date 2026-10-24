import {canonicalize} from "./canonicalize.js";
/**
 * Structural type identity for IfEquals-style comparisons.
 * @param {*} a - First type.
 * @param {*} b - Second type.
 * @returns {boolean} True when structurally identical.
 * @example
 * deepEqualType({b: 1, a: 2}, {a: 2, b: 1}); // true
 */
function deepEqualType(a, b) {
  return JSON.stringify(canonicalize(a)) === JSON.stringify(canonicalize(b));
}
export {deepEqualType};
