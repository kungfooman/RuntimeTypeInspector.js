import {recurseSubstitute} from "./substitutes.js";
/**
 * Substitutes a tuple member, touching its element type.
 * @param {*} type - The tuple member type.
 * @param {*} search - The search.
 * @param {*} replace - The replace.
 * @param {console["warn"]} warn - Function to warn with.
 * @returns {*} Substituted tuple member or the original.
 * @example
 * substituteTupleMember({type: 'tupleMember', elementType: 'K', name: 'x'}, 'K', '"a"', console.warn);
 * // {type: 'tupleMember', elementType: '"a"', name: 'x'}
 */
function substituteTupleMember(type, search, replace, warn) {
  const elementType = recurseSubstitute(type.elementType, search, replace, warn);
  return elementType === type.elementType ? type : {...type, elementType};
}
export {substituteTupleMember};
