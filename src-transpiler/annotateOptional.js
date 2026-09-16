/**
 * @typedef DocType
 * @property {boolean} optional - Type is optional.
 */
/**
 * Annotates a type with optionality for internal use (parseJSDoc navigation).
 * Sets optionality on object types and wraps bare strings that need to be
 * expandable containers (e.g. 'object', 'object[]', 'union') into objects
 * so that parseJSDoc can later navigate into their properties.
 * Does NOT recurse into compound types or delete properties — those are
 * kept fully expanded so that parseJSDoc and JSDocAnnotator can still
 * mutate them (e.g. appending nested @param lines).
 * @param {string | DocType} type - The type.
 * @param {boolean} optional - Optionality
 * @returns {string | DocType} The annotated type.
 */
function annotateOptional(type, optional) {
  // If it's already an object, just set optionality.
  if (type instanceof Object) {
    type.optional = optional;
  } else if (typeof type === 'string') {
    type = type.trim();
    if (type !== 'object' && type !== 'object[]' && type !== 'union' && !optional) {
      return type;
    }
    type = {type, optional};
  } else {
    debugger;
    console.warn("annotateOptional> neither object nor string for type", type);
  }
  return type;
}
export {annotateOptional};
