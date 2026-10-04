import {recurseSubstitute} from "./substitutes.js";
/**
 * Substitutes an array type, touching its element type.
 * @param {*} type - The array type.
 * @param {*} search - The search.
 * @param {*} replace - The replace.
 * @param {console["warn"]} warn - Function to warn with.
 * @returns {*} Substituted array type or the original.
 * @example
 * substituteArray({type: 'array', elementType: 'K'}, 'K', '"a"', console.warn);
 * // {type: 'array', elementType: '"a"'}
 */
function substituteArray(type, search, replace, warn) {
  const elementType = recurseSubstitute(type.elementType, search, replace, warn);
  return elementType === type.elementType ? type : {...type, elementType};
}
export {substituteArray};
