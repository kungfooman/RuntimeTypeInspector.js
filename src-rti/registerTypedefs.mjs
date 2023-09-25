/**
 * @type {Record<string, object>}
 */
const typedefs = {};
/**
 * @param {Record<string, object>} typedefs_ - The parsed typedefs from source.
 */
function registerTypedefs(typedefs_) {
  Object.assign(typedefs, typedefs_);
}
export {registerTypedefs};
