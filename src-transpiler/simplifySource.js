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
function simplifySource(type) {
  if (!(type instanceof Object)) {
    return type;
  }
  const out = {...type};
  if (out.properties && Object.keys(out.properties).length) {
    out.properties = Object.fromEntries(
      Object.entries(out.properties).map(([k, v]) => [k, simplifySource(v)])
    );
  }
  if (out.indexSignatures && Array.isArray(out.indexSignatures)) {
    out.indexSignatures = out.indexSignatures.map(simplifySource);
  }
  if (out.type === 'object' && out.properties && Object.keys(out.properties).length === 0) {
    delete out.properties;
  }
  if (out.type === 'union' && out.members) {
    out.members = out.members.map(simplifySource);
  }
  if (out.type === 'array' && out.elementType) {
    out.elementType = simplifySource(out.elementType);
  }
  if (out.type === 'tuple' && out.elements) {
    out.elements = out.elements.map(simplifySource);
  }
  if (out.type === 'promise' && out.elementType) {
    out.elementType = simplifySource(out.elementType);
  }
  if (out.type === 'record') {
    if (out.key) out.key = simplifySource(out.key);
    if (out.val) out.val = simplifySource(out.val);
  }
  if (out.type === 'typeof' && out.argument) {
    out.argument = simplifySource(out.argument);
  }
  if (out.type === 'object' && !out.properties && !out.indexSignatures && !out.optional) {
    return 'object';
  }
  return out;
}
export {simplifySource};
