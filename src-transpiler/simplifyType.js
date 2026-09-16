import {mapValues} from './mapValues.js';
/**
 * @typedef DocType
 * @property {boolean} optional - Type is optional.
 */
/**
 * Recursively clones and simplifies a type for emission into source code.
 * Strips empty `properties` and collapses empty `object` types to the bare
 * string `'object'`.  Numbers/booleans (literal types) pass through.
 * Non-destructive — the original type tree is never mutated.
 * @param {string | DocType | number | boolean} type - The type.
 * @returns {string | DocType | number | boolean} The simplified type.
 */
function simplifyType(type) {
  if (!(type instanceof Object)) {
    return type;
  }
  const out = {...type};
  if (out.properties) {
    out.properties = mapValues(out.properties, simplifyType);
    if (out.type === 'object' && !Object.keys(out.properties).length) {
      delete out.properties;
    }
  }
  if (out.indexSignatures && Array.isArray(out.indexSignatures)) {
    out.indexSignatures = out.indexSignatures.map(simplifyType);
  }
  if (out.type === 'union' && out.members) {
    out.members = out.members.map(simplifyType);
  }
  if (out.type === 'array' && out.elementType) {
    out.elementType = simplifyType(out.elementType);
  }
  if (out.type === 'tuple' && out.elements) {
    out.elements = out.elements.map(simplifyType);
  }
  if (out.type === 'promise' && out.elementType) {
    out.elementType = simplifyType(out.elementType);
  }
  if (out.type === 'record') {
    if (out.key) out.key = simplifyType(out.key);
    if (out.val) out.val = simplifyType(out.val);
  }
  if (out.type === 'typeof' && out.argument) {
    out.argument = simplifyType(out.argument);
  }
  if (out.type === 'object' && !out.properties && !out.indexSignatures && !out.optional) {
    return 'object';
  }
  return out;
}
export {simplifyType};
