import {substituteType} from "./substituteType.js";
/**
 * Substitutes a record of types (e.g. object properties), returning the
 * original when nothing changed.
 * @param {Record<string, *>|undefined} record - Type record or undefined.
 * @param {*} search - The search.
 * @param {*} replace - The replace.
 * @param {console["warn"]} warn - Function to warn with.
 * @returns {Record<string, *>|undefined} Substituted record or the original.
 * @example
 * substituteRecord({a: 'K'}, 'K', '"a"', console.warn);
 * // {a: '"a"'}
 */
function substituteRecord(record, search, replace, warn) {
  if (record === null || typeof record !== 'object') {
    return record;
  }
  let out = record;
  for (const prop in record) {
    const next = substituteType(record[prop], search, replace, warn);
    if (next !== record[prop]) {
      if (out === record) {
        out = {...record};
      }
      out[prop] = next;
    }
  }
  return out;
}
export {substituteRecord};
