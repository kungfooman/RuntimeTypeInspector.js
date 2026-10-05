import {recurseSubstitute} from "./substitutes.js";
/**
 * Substitutes a map type, touching its key and value.
 * @param {*} type - The map type.
 * @param {*} search - The search.
 * @param {*} replace - The replace.
 * @param {console["warn"]} warn - Function to warn with.
 * @returns {*} Substituted map type or the original.
 * @example
 * substituteMapNode({type: 'map', key: 'K', val: 'string'}, 'K', '"a"', console.warn);
 * // {type: 'map', key: '"a"', val: 'string'}
 */
function substituteMapNode(type, search, replace, warn) {
  const key = recurseSubstitute(type.key, search, replace, warn);
  const val = recurseSubstitute(type.val, search, replace, warn);
  return key === type.key && val === type.val ? type : {...type, key, val};
}
export {substituteMapNode};
