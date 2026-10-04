import {substitutes, recurseSubstitute} from "./substitutes.js";
/**
 * Substitutes an object type, touching properties and index signatures.
 * @param {*} type - The object type.
 * @param {*} search - The search.
 * @param {*} replace - The replace.
 * @param {console["warn"]} warn - Function to warn with.
 * @returns {*} Substituted object type or the original.
 * @example
 * substituteObject({type: 'object', properties: {a: 'K'}}, 'K', '"a"', console.warn);
 * // {type: 'object', properties: {a: '"a"'}}
 */
function substituteObject(type, search, replace, warn) {
  const {properties} = type;
  const next = substitutes.substituteRecord(properties, search, replace, warn);
  const signatures = substitutes.substituteList(type.indexSignatures, search, replace, warn);
  if (next === properties && signatures === type.indexSignatures) {
    return type;
  }
  const out = {...type};
  if (next !== properties) {
    out.properties = next;
  }
  if (signatures !== type.indexSignatures) {
    out.indexSignatures = signatures;
  }
  return out;
}
export {substituteObject};
