import {recurseSubstitute} from "./substitutes.js";
/**
 * Substitutes a record type, touching its key and value.
 * @param {*} type - The record type.
 * @param {*} search - The search.
 * @param {*} replace - The replace.
 * @param {console["warn"]} warn - Function to warn with.
 * @returns {*} Substituted record type or the original.
 * @example
 * substituteRecordNode({type: 'record', key: 'K', val: 'string'}, 'K', '"a"', console.warn);
 * // {type: 'record', key: '"a"', val: 'string'}
 */
function substituteRecordNode(type, search, replace, warn) {
  const key = recurseSubstitute(type.key, search, replace, warn);
  const val = recurseSubstitute(type.val, search, replace, warn);
  return key === type.key && val === type.val ? type : {...type, key, val};
}
export {substituteRecordNode};
