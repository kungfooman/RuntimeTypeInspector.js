import {substitutes} from "./substitutes.js";
/**
 * Substitutes an intersection type, touching its members.
 * @param {*} type - The intersection type.
 * @param {*} search - The search.
 * @param {*} replace - The replace.
 * @param {console["warn"]} warn - Function to warn with.
 * @returns {*} Substituted intersection type or the original.
 * @example
 * substituteIntersection({type: 'intersection', members: ['K', 'number']}, 'K', '"a"', console.warn);
 * // {type: 'intersection', members: ['"a"', 'number']}
 */
function substituteIntersection(type, search, replace, warn) {
  const members = substitutes.substituteList(type.members, search, replace, warn);
  return members === type.members ? type : {...type, members};
}
export {substituteIntersection};
