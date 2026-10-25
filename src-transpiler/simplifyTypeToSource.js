import {simplifyType} from './simplifyType.js';
/** @import {ExpandedType} from './expandedType.js' */
/**
 * Returns the pretty-printed JSON of the simplified type for embedding
 * into generated source code.
 * @param {ExpandedType} type - The type.
 * @returns {string} JSON source ready for code generation.
 */
function simplifyTypeToSource(type) {
  return JSON.stringify(simplifyType(type), null, 2);
}
export {simplifyTypeToSource};
