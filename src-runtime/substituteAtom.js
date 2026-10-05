import {recurseSubstitute} from "./substitutes.js";
/**
 * Substitutes an annotated atom (`{type: 'T', optional: true}`), touching
 * only the `.type` position and preserving identity when unchanged.
 * @param {*} type - The annotated atom.
 * @param {*} search - The search.
 * @param {*} replace - The replace.
 * @param {console["warn"]} warn - Function to warn with.
 * @returns {*} Substituted atom or the original.
 * @example
 * substituteAtom({type: 'K', optional: true}, 'K', '"a"', console.warn);
 * // {type: '"a"', optional: true}
 */
function substituteAtom(type, search, replace, warn) {
  const inner = recurseSubstitute(type.type, search, replace, warn);
  return inner === type.type ? type : {...type, type: inner};
}
export {substituteAtom};
