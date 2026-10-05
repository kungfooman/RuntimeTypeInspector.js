import {recurseSubstitute} from "./substitutes.js";
/**
 * Substitutes a list of types, returning the original when nothing
 * changed so unchanged subtrees keep their identity for downstream memos.
 * @param {any[]|undefined} items - Type list or undefined.
 * @param {*} search - The search.
 * @param {*} replace - The replace.
 * @param {console["warn"]} warn - Function to warn with.
 * @returns {any[]|undefined} Substituted list or the original.
 * @example
 * substituteList(['K', 'string'], 'K', '"a"', console.warn);
 * // ['"a"', 'string']
 */
function substituteList(items, search, replace, warn) {
  if (!Array.isArray(items)) {
    return items;
  }
  let out = items;
  for (let i = 0; i < items.length; i++) {
    const next = recurseSubstitute(items[i], search, replace, warn);
    if (next !== items[i]) {
      if (out === items) {
        out = items.slice(0, i);
      }
      out.push(next);
    } else if (out !== items) {
      out.push(items[i]);
    }
  }
  return out;
}
export {substituteList};
