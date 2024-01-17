//import {createType } from "./createType.js";
import {resolveType } from "./resolveType.js";
//import {replaceType } from "./replaceType.js";
import {getTypeKeys } from "./validateKeyof.mjs";
/**
 * @param {import('./validateIndexedAccess.js').IndexedAccess} expect - The supposed type information of said value.
 * @param {console["warn"]} warn - Function to warn with.
 * @returns {import('./validateType.mjs').TypeObject|undefined} - New type that can be used for validation.
 */
function createTypeFromIndexedAccess(expect, warn) {
  const {object, index} = expect;
  const resolvedObject = resolveType(object, 'object', warn);
  if (resolvedObject)  {
    // const indexType = createType(index, warn);
    const indexKeys = getTypeKeys(index, warn);
    //console.log("createTypeFromIndexedAccess", {resolvedObject, object, index, indexType, indexKeys});
    if (!indexKeys) {
      warn('createTypeFromIndexedAccess: missing indexKeys');
      return;
    }
    /** @type {import('./validateType.mjs').Type[]} */
    const members = [];
    for (const indexKey of indexKeys) {
      let prop = resolvedObject.properties[indexKey];
      if (!prop) {
        console.warn(`Missing prop for ${indexKey}`, {indexKey});
      }
      //console.log("asd", indexKey, prop);
      if (typeof prop === 'string') {
        // Remove ' from string literal
        if (prop[0] === "'" && prop[prop.length - 1] === "'") {
          prop = prop.slice(1, -1);
        }
        // Remove " from string literal
        if (prop[0] === '"' && prop[prop.length - 1] === '"') {
          prop = prop.slice(1, -1);
        }
      }
      members.push(prop);
      //const cloneResult = structuredClone(result);
      //replaceType(cloneResult, element, typeKey, warn);
      //properties[typeKey] = cloneResult;
    }
    return {type: 'union', members, optional: false};
  }
}
export {createTypeFromIndexedAccess};
