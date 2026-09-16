import {simplifyType} from './simplifyType.js';
/**
 * Returns the pretty-printed JSON of the simplified type for embedding
 * into generated source code.
 * @param {import('./simplifyType.js').DocType | string | number | boolean} type - The type.
 * @returns {string} JSON source ready for code generation.
 */
function simplifyTypeToSource(type) {
  return JSON.stringify(simplifyType(type), null, 2);
}
export {simplifyTypeToSource};
