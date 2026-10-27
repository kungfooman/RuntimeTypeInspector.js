import {getTypeKeys} from "./getTypeKeys.js";
import {stripKey} from "./stripKey.js";
import {resolveObjectSide} from "./resolveObjectSide.js";
/**
 * @param {import('./validateIndexedAccess.js').IndexedAccess} expect - The supposed type information of said value.
 * @param {console["warn"]} warn - Function to warn with.
 * @returns {import('./validateType.js').TypeObject|undefined} - New type that can be used for validation.
 * @example
 * // input: {type: 'indexedAccess', object: {type: 'object', properties: {a: 'K'}}, index: '"a"'}
 * createTypeFromIndexedAccess(expandType('Obj["a"]'), console.warn);
 * // 'K'
 */
function createTypeFromIndexedAccess(expect, warn) {
  const {object, index} = expect;
  const resolvedObject = resolveObjectSide(object, warn);
  if (!resolvedObject || !resolvedObject.properties) {
    warn('validateIndexedAccess: unresolvable indexed access', {expect});
    return;
  }
  const indexKeys = getTypeKeys(index, warn);
  //console.log("createTypeFromIndexedAccess", {resolvedObject, object, index, indexKeys});
  if (!indexKeys) {
    warn('createTypeFromIndexedAccess: missing indexKeys');
    return;
  }
  /** @type {import('./validateType.js').Type[]} */
  const members = [];
  for (const indexKey of indexKeys) {
    const prop = resolvedObject.properties[stripKey(indexKey)];
    if (prop === undefined) {
      continue;
    }
    // NB: quoted literals stay quoted, they are types: '"x"' validates
    // the value 'x', while bare 'x' would warn unchecked and always fail.
    members.push(prop);
  }
  if (!members.length) {
    warn('validateIndexedAccess: unresolvable indexed access', {expect});
    return;
  }
  if (members.length === 1) {
    // Single property: return it directly so source flags (`optional`,
    // `readonly`) survive instead of hiding behind a required wrapper.
    return members[0];
  }
  return {type: 'union', members, optional: false};
}
export {createTypeFromIndexedAccess};
