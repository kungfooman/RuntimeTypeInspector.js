import {resolveType                } from "./resolveType.js";
import {createTypeFromIndexedAccess} from "./createTypeFromIndexedAccess.js";
import {createTypeFromKeyof        } from "./createTypeFromKeyof.js";
import {createTypeFromMapping      } from "./createTypeFromMapping.js";
/**
 * @param {string|import('./validateType.js').Type} expect - The supposed type information of said value.
 * @param {console["warn"]} warn - Function to warn with.
 * @returns {import('./validateType.js').Type|undefined} - New type that can be used for validatoin
 */
function createType(expect, warn) {
  const mapping = resolveType(expect, 'mapping', warn);
  if (mapping) {
    return createTypeFromMapping(mapping, warn);
  }
  const indexedAccess = resolveType(expect, 'indexedAccess', warn);
  if (indexedAccess) {
    return createTypeFromIndexedAccess(indexedAccess, warn);
  }
  const keyof = resolveType(expect, 'keyof', warn);
  if (keyof) {
    return createTypeFromKeyof(keyof, warn);
  }
  return expect;
}
export {createType};
