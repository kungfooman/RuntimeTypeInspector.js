import {recurseSubstitute} from "./substitutes.js";
/**
 * Substitutes a promise/set/class type, touching its element type.
 * @param {*} type - The promise/set/class type.
 * @param {*} search - The search.
 * @param {*} replace - The replace.
 * @param {console["warn"]} warn - Function to warn with.
 * @returns {*} Substituted type or the original.
 * @example
 * substitutePromise({type: 'promise', elementType: 'K'}, 'K', '"a"', console.warn);
 * // {type: 'promise', elementType: '"a"'}
 */
function substitutePromise(type, search, replace, warn) {
  const elementType = recurseSubstitute(type.elementType, search, replace, warn);
  return elementType === type.elementType ? type : {...type, elementType};
}
export {substitutePromise};
