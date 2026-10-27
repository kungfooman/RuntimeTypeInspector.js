import {recurseSubstitute} from "./substitutes.js";
/**
 * Substitutes an annotated atom (`{type: 'atom', atomType: 'T', optional:
 * true}`), touching only the `.atomType` position and preserving identity
 * when unchanged. A tree replacement keeps its own shape with the
 * occurrence flags merged in, so a tree never lands in the leaf `.atomType`
 * position the validators switch on.
 * @param {*} type - The annotated atom.
 * @param {*} search - The search.
 * @param {*} replace - The replace.
 * @param {console["warn"]} warn - Function to warn with.
 * @returns {*} Substituted atom or the original.
 * @example
 * // input: {type: 'atom', atomType: 'K', optional: true}
 * substituteAtom(expandType('{a?: K}').properties.a, 'K', '"a"', console.warn);
 * // {type: 'atom', atomType: '"a"', optional: true}
 */
function substituteAtom(type, search, replace, warn) {
  const inner = recurseSubstitute(type.atomType, search, replace, warn);
  if (inner === type.atomType) {
    return type;
  }
  if (inner !== null && typeof inner === 'object' && !Array.isArray(inner)) {
    return {...inner, optional: type.optional || inner.optional, readonly: type.readonly ?? inner.readonly};
  }
  return {...type, atomType: inner};
}
export {substituteAtom};
