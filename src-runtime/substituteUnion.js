import {substitutes} from "./substitutes.js";
/**
 * Substitutes a union type, touching its members.
 * @param {*} type - The union type.
 * @param {*} search - The search.
 * @param {*} replace - The replace.
 * @param {console["warn"]} warn - Function to warn with.
 * @returns {*} Substituted union type or the original.
 * @example
 * substituteUnion({type: 'union', members: ['K', 'number']}, 'K', '"a"', console.warn);
 * // {type: 'union', members: ['"a"', 'number']}
 */
function substituteUnion(type, search, replace, warn) {
  const members = substitutes.substituteList(type.members, search, replace, warn);
  return members === type.members ? type : {...type, members};
}
export {substituteUnion};
