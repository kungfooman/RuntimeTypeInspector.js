import {substitutes, recurseSubstitute} from "./substitutes.js";
/**
 * Substitutes a new-type constructor, touching its parameters and return type.
 * @param {*} type - The new type.
 * @param {*} search - The search.
 * @param {*} replace - The replace.
 * @param {console["warn"]} warn - Function to warn with.
 * @returns {*} Substituted new type or the original.
 * @example
 * substituteNew({type: 'new', parameters: [{type: 'K', name: 'x'}], ret: 'K'}, 'K', '"a"', console.warn);
 * // {type: 'new', parameters: [{type: '"a"', name: 'x'}], ret: '"a"'}
 */
function substituteNew(type, search, replace, warn) {
  const parameters = substitutes.substituteDescriptors(type.parameters, search, replace, warn);
  const ret = type.ret === undefined ? undefined : recurseSubstitute(type.ret, search, replace, warn);
  if (parameters === type.parameters && ret === type.ret) {
    return type;
  }
  return {...type, parameters, ret};
}
export {substituteNew};
