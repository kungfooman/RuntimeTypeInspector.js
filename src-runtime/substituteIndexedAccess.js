import {recurseSubstitute} from "./substitutes.js";
/**
 * Substitutes an indexed access type, touching its index and object.
 * @param {*} type - The indexed access type.
 * @param {*} search - The search.
 * @param {*} replace - The replace.
 * @param {console["warn"]} warn - Function to warn with.
 * @returns {*} Substituted indexed access type or the original.
 * @example
 * substituteIndexedAccess({type: 'indexedAccess', object: 'T', index: 'K'}, 'K', '"a"', console.warn);
 * // {type: 'indexedAccess', object: 'T', index: '"a"'}
 */
function substituteIndexedAccess(type, search, replace, warn) {
  const index = recurseSubstitute(type.index, search, replace, warn);
  const object = recurseSubstitute(type.object, search, replace, warn);
  return index === type.index && object === type.object ? type : {...type, index, object};
}
export {substituteIndexedAccess};
