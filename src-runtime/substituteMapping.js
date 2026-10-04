import {recurseSubstitute} from "./substitutes.js";
/**
 * Substitutes a mapping type, touching its iterable, result, and optional
 * name type. The `element` binding is shadowed and never substituted.
 * @param {*} type - The mapping type.
 * @param {*} search - The search.
 * @param {*} replace - The replace.
 * @param {console["warn"]} warn - Function to warn with.
 * @returns {*} Substituted mapping type or the original.
 * @example
 * substituteMapping({type: 'mapping', iterable: 'T', element: 'k', result: 'K'}, 'K', '"a"', console.warn);
 * // {type: 'mapping', iterable: 'T', element: 'k', result: '"a"'}
 */
function substituteMapping(type, search, replace, warn) {
  if (type.element === search) {
    return type;
  }
  const iterable = recurseSubstitute(type.iterable, search, replace, warn);
  const result = recurseSubstitute(type.result, search, replace, warn);
  const nameType = type.nameType === undefined ? undefined : recurseSubstitute(type.nameType, search, replace, warn);
  if (iterable === type.iterable && result === type.result && nameType === type.nameType) {
    return type;
  }
  return {...type, iterable, result, nameType};
}
export {substituteMapping};
