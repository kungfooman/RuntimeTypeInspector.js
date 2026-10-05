import {substitutes} from "./substitutes.js";
/**
 * Substitutes a tuple type, touching its elements.
 * @param {*} type - The tuple type.
 * @param {*} search - The search.
 * @param {*} replace - The replace.
 * @param {console["warn"]} warn - Function to warn with.
 * @returns {*} Substituted tuple type or the original.
 * @example
 * substituteTuple({type: 'tuple', elements: ['K', 'number']}, 'K', '"a"', console.warn);
 * // {type: 'tuple', elements: ['"a"', 'number']}
 */
function substituteTuple(type, search, replace, warn) {
  const elements = substitutes.substituteList(type.elements, search, replace, warn);
  return elements === type.elements ? type : {...type, elements};
}
export {substituteTuple};
