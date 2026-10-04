import {recurseSubstitute} from "./substitutes.js";
/**
 * Substitutes a set type, touching its element type.
 * @param {*} type - The set type.
 * @param {*} search - The search.
 * @param {*} replace - The replace.
 * @param {console["warn"]} warn - Function to warn with.
 * @returns {*} Substituted set type or the original.
 * @example
 * substituteSet({type: 'set', elementType: 'K'}, 'K', '"a"', console.warn);
 * // {type: 'set', elementType: '"a"'}
 */
function substituteSet(type, search, replace, warn) {
  const elementType = recurseSubstitute(type.elementType, search, replace, warn);
  return elementType === type.elementType ? type : {...type, elementType};
}
export {substituteSet};
