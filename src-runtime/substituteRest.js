import {recurseSubstitute} from "./substitutes.js";
/**
 * Substitutes a rest type, touching its annotation.
 * @param {*} type - The rest type.
 * @param {*} search - The search.
 * @param {*} replace - The replace.
 * @param {console["warn"]} warn - Function to warn with.
 * @returns {*} Substituted rest type or the original.
 * @example
 * substituteRest({type: 'rest', annotation: 'K'}, 'K', '"a"', console.warn);
 * // {type: 'rest', annotation: '"a"'}
 */
function substituteRest(type, search, replace, warn) {
  const annotation = recurseSubstitute(type.annotation, search, replace, warn);
  return annotation === type.annotation ? type : {...type, annotation};
}
export {substituteRest};
