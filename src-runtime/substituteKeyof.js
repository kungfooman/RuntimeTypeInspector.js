import {recurseSubstitute} from "./substitutes.js";
/**
 * Substitutes a keyof type, touching its argument.
 * @param {*} type - The keyof type.
 * @param {*} search - The search.
 * @param {*} replace - The replace.
 * @param {console["warn"]} warn - Function to warn with.
 * @returns {*} Substituted keyof type or the original.
 * @example
 * substituteKeyof({type: 'keyof', argument: 'K'}, 'K', '"a"', console.warn);
 * // {type: 'keyof', argument: '"a"'}
 */
function substituteKeyof(type, search, replace, warn) {
  const argument = recurseSubstitute(type.argument, search, replace, warn);
  return argument === type.argument ? type : {...type, argument};
}
export {substituteKeyof};
