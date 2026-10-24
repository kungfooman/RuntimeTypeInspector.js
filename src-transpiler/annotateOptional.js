/** @import {ExpandedType} from './expandedType.js' */
/**
 * Annotates a type with optionality for internal use (parseJSDoc navigation).
 * Sets optionality on object types and wraps bare strings that need to be
 * expandable containers (e.g. 'object', 'object[]', 'union') into objects
 * so that parseJSDoc can later navigate into their properties.
 * Does NOT recurse into compound types or delete properties — those are
 * kept fully expanded so that parseJSDoc and JSDocAnnotator can still
 * mutate them (e.g. appending nested @param lines).
 * Literal types (numbers/booleans) pass through bare unless optional,
 * mirroring the string path.
 * @param {ExpandedType} type - The type.
 * @param {boolean} optional - Optionality
 * @returns {ExpandedType} The annotated type.
 */
function annotateOptional(type, optional) {
  // If it's already an object, just set optionality. The flag is read
  // structurally off any node (see validateTypedef, substituteAtom), so
  // the write goes through a minimal structural cast.
  if (type instanceof Object) {
    /** @type {{optional?: boolean}} */ (type).optional = optional;
  } else if (typeof type === 'number' || typeof type === 'boolean') {
    if (!optional) {
      return type;
    }
    type = ({type, optional});
  } else if (typeof type === 'string') {
    type = type.trim();
    if (type !== 'object' && type !== 'object[]' && type !== 'union' && !optional) {
      return type;
    }
    type = ({type, optional});
  } else {
    debugger;
    console.warn("annotateOptional> neither object nor string for type", type);
  }
  return type;
}
export {annotateOptional};
