import {recurseSubstitute} from "./substitutes.js";
/**
 * Substitutes an annotated atom (`{type: 'T', optional: true}`), touching
 * only the `.type` position and preserving identity when unchanged. A tree
 * replacement keeps its own shape with the occurrence flags merged in, so a
 * tree never lands in the leaf `.type` position the validators switch on.
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
  if (inner === type.type) {
    return type;
  }
  if (inner !== null && typeof inner === 'object' && !Array.isArray(inner)) {
    return {...inner, optional: type.optional || inner.optional, readonly: type.readonly ?? inner.readonly};
  }
  return {...type, type: inner};
}
export {substituteAtom};
