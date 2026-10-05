import {substitutes, recurseSubstitute} from "./substitutes.js";
/**
 * Substitutes an index signature, touching the index type and parameters.
 * @param {*} type - The index signature type.
 * @param {*} search - The search.
 * @param {*} replace - The replace.
 * @param {console["warn"]} warn - Function to warn with.
 * @returns {*} Substituted index signature or the original.
 * @example
 * substituteIndexSignature({type: 'indexSignature', indexType: 'K'}, 'K', '"a"', console.warn);
 * // {type: 'indexSignature', indexType: '"a"'}
 */
function substituteIndexSignature(type, search, replace, warn) {
  const indexType = type.indexType === undefined ? undefined : recurseSubstitute(type.indexType, search, replace, warn);
  const indexParameters = substitutes.substituteDescriptors(type.indexParameters, search, replace, warn);
  if (indexType === type.indexType && indexParameters === type.indexParameters) {
    return type;
  }
  return {...type, indexType, indexParameters};
}
export {substituteIndexSignature};
