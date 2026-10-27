import {recurseSubstitute} from "./substitutes.js";
/**
 * Substitutes parameter descriptors (`{type: 'parameter', paramType,
 * name}`), touching only each descriptor's `.paramType` position and
 * preserving identity when unchanged.
 * @param {any[]|undefined} parameters - Descriptors or undefined.
 * @param {*} search - The search.
 * @param {*} replace - The replace.
 * @param {console["warn"]} warn - Function to warn with.
 * @returns {any[]|undefined} Substituted descriptors or the original.
 * @example
 * substituteDescriptors([{type: 'parameter', paramType: 'K', name: 'x'}], 'K', '"a"', console.warn);
 * // [{type: 'parameter', paramType: '"a"', name: 'x'}]
 */
function substituteDescriptors(parameters, search, replace, warn) {
  if (!Array.isArray(parameters)) {
    return parameters;
  }
  let out = parameters;
  for (let i = 0; i < parameters.length; i++) {
    const parameter = parameters[i];
    if (parameter && typeof parameter === 'object' && parameter.paramType !== undefined) {
      const next = recurseSubstitute(parameter.paramType, search, replace, warn);
      if (next !== parameter.paramType) {
        if (out === parameters) {
          out = parameters.slice();
        }
        out[i] = {...parameter, paramType: next};
      }
    }
  }
  return out;
}
export {substituteDescriptors};
