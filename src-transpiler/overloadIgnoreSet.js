import {ignoredParamsIn} from './ignoredParamsIn.js';
/**
 * Reads the scoped suppression set for overload emission.
 * @param {string|null} leading - Leading documentation comment.
 * @returns {Set<string>|string|null} Suppression set, all, or none.
 * @example
 * overloadIgnoreSet(null); // null
 */
function overloadIgnoreSet(leading) {
  if (!leading) {
    return null;
  }
  return ignoredParamsIn(leading);
}
export {overloadIgnoreSet};
