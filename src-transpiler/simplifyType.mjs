/**
 * @typedef DocType
 * @property {boolean} optional - Type is optional.
 */
/**
 * @param {string | DocType} type - The type.
 * @param {boolean} optional - Optionality
 * @returns {string | DocType} The simplified type.
 */
function simplifyType(type, optional) {
  // If it's already an object, just set optionality.
  if (type instanceof Object) {
    type.optional = optional;
  } else if (typeof type === 'string') {
    type = type.trim();
    if (type !== 'object' && type !== 'object[]' && type !== 'union' && !optional) {
      // console.log("simplify", type);
      return type;
    }
    type = {type, optional};
  } else {
    debugger;
    console.warn("simplifyType> neither object nor string for type", type);
  }
  if (type.type === 'object' && type.properties && Object.keys(type.properties).length === 0) {
    delete type.properties;
    // console.log("delete empty", type);
  }
  return type;
}
export {simplifyType};
