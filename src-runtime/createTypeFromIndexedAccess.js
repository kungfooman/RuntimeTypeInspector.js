//import {createType } from "./createType.js";
import {resolveType } from "./resolveType.js";
//import {replaceType } from "./replaceType.js";
import {getTypeKeys } from "./getTypeKeys.js";
import {typedefs} from "./registerTypedef.js";
import {createTypeFromMapping} from "./createTypeFromMapping.js";
/**
 * @param {import('./validateIndexedAccess.js').IndexedAccess} expect - The supposed type information of said value.
 * @param {console["warn"]} warn - Function to warn with.
 * @returns {import('./validateType.js').TypeObject|undefined} - New type that can be used for validation.
 */
function createTypeFromIndexedAccess(expect, warn) {
  const {object, index} = expect;
  let resolvedObject = resolveType(object, 'object', warn);
  if (!resolvedObject) {
    // Indexing into a mapped type materializes it first.
    const target = typeof object === 'string' ? typedefs[object] : object;
    if (target && target.type === 'mapping') {
      resolvedObject = createTypeFromMapping(target, warn);
    }
  }
  if (resolvedObject) {
    // const indexType = createType(index, warn);
    const indexKeys = getTypeKeys(index, warn);
    //console.log("createTypeFromIndexedAccess", {resolvedObject, object, index, indexType, indexKeys});
    if (!indexKeys) {
      warn('createTypeFromIndexedAccess: missing indexKeys');
      return;
    }
    /** @type {import('./validateType.js').Type[]} */
    const members = [];
    for (const indexKey of indexKeys) {
      const prop = resolvedObject.properties[indexKey];
      if (prop === undefined) {
        console.warn(`Missing prop for ${indexKey}`, {indexKey});
        continue;
      }
      // NB: quoted literals stay quoted, they are types: '"x"' validates
      // the value 'x', while bare 'x' would warn unchecked and always fail.
      members.push(prop);
      //const cloneResult = structuredClone(result);
      //replaceType(cloneResult, element, typeKey, warn);
      //properties[typeKey] = cloneResult;
    }
    return {type: 'union', members, optional: false};
  }
}
export {createTypeFromIndexedAccess};
