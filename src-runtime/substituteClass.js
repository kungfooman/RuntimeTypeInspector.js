import {recurseSubstitute} from "./substitutes.js";
/**
 * Substitutes a class type, touching its element type.
 * @param {*} type - The class type.
 * @param {*} search - The search.
 * @param {*} replace - The replace.
 * @param {console["warn"]} warn - Function to warn with.
 * @returns {*} Substituted class type or the original.
 * @example
 * substituteClass({type: 'class', elementType: 'K'}, 'K', '"a"', console.warn);
 * // {type: 'class', elementType: '"a"'}
 */
function substituteClass(type, search, replace, warn) {
  const elementType = recurseSubstitute(type.elementType, search, replace, warn);
  return elementType === type.elementType ? type : {...type, elementType};
}
export {substituteClass};
