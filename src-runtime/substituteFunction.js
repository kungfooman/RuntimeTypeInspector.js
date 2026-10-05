import {substitutes, recurseSubstitute} from "./substitutes.js";
/**
 * Substitutes a function/new type, touching its parameters and return type.
 * @param {*} type - The function/new type.
 * @param {*} search - The search.
 * @param {*} replace - The replace.
 * @param {console["warn"]} warn - Function to warn with.
 * @returns {*} Substituted function/new type or the original.
 * @example
 * substituteFunction({type: 'function', parameters: [{type: 'K', name: 'x'}], ret: 'K'}, 'K', '"a"', console.warn);
 * // {type: 'function', parameters: [{type: '"a"', name: 'x'}], ret: '"a"'}
 */
function substituteFunction(type, search, replace, warn) {
  const parameters = substitutes.substituteDescriptors(type.parameters, search, replace, warn);
  const ret = type.ret === undefined ? undefined : recurseSubstitute(type.ret, search, replace, warn);
  if (parameters === type.parameters && ret === type.ret) {
    return type;
  }
  return {...type, parameters, ret};
}
export {substituteFunction};
