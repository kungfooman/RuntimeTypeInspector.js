import {substitutes} from "./substitutes.js";
/**
 * Substitutes a reference type, touching its type arguments.
 * @param {*} type - The reference type.
 * @param {*} search - The search.
 * @param {*} replace - The replace.
 * @param {console["warn"]} warn - Function to warn with.
 * @returns {*} Substituted reference type or the original.
 * @example
 * substituteReference({type: 'reference', name: 'Box', args: ['K']}, 'K', '"a"', console.warn);
 * // {type: 'reference', name: 'Box', args: ['"a"']}
 */
function substituteReference(type, search, replace, warn) {
  const {args} = type;
  if (!Array.isArray(args)) {
    return type;
  }
  const next = substitutes.substituteList(args, search, replace, warn);
  return next === args ? type : {...type, args: next};
}
export {substituteReference};
