import {typedefs} from "./registerTypedef.mjs";
/**
 * @param {any} type - The type.
 * @param {string} as - What to resolve as.
 * @returns {any} - Resolved type.
 */
function resolveType(type, as) {
  for (let depth = 0; depth < 20; depth++) {
    if (typeof type === 'string' && typedefs[type]) {
      type = typedefs[type];
    }
    if (type.type) {
      if (type.type === as) {
        return type;
      }
      // If we already resolved as a structured type, it can't be a typedef any longer.
      return;
    }
  }
}
export {resolveType};
