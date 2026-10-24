import {mapValues} from './mapValues.js';
/** @import {ExpandedType, ExpandIndexSignatureNode} from './expandedType.js' */
/**
 * Recursively clones and simplifies a type for emission into source code.
 * Empty `properties` are preserved (not deleted) and empty `object` types
 * are kept structured: `{type: 'object'}` without a `properties` key is the
 * `{}` literal (accepts every non-nullish value like TS), while
 * `{type: 'object', properties: {}}` is the `object` keyword (rejects
 * primitives). Collapsing either form would erase that distinction.
 * Numbers/booleans (literal types) pass through.
 * Non-destructive — the original type tree is never mutated.
 * @param {ExpandedType} type - The type.
 * @returns {ExpandedType} The simplified type.
 */
function simplifyType(type) {
  if (!(type instanceof Object)) {
    return type;
  }
  const out = {...type};
  if ('properties' in out && out.properties) {
    out.properties = mapValues(out.properties, simplifyType);
  }
  if ('indexSignatures' in out && out.indexSignatures && Array.isArray(out.indexSignatures)) {
    out.indexSignatures = /** @type {ExpandIndexSignatureNode[]} */ (out.indexSignatures.map(simplifyType));
  }
  if ('members' in out && out.members) {
    out.members = out.members.map(simplifyType);
  }
  if ('elementType' in out && out.elementType) {
    out.elementType = simplifyType(out.elementType);
  }
  if ('elements' in out && out.elements) {
    out.elements = out.elements.map(simplifyType);
  }
  if ('args' in out && Array.isArray(out.args)) {
    out.args = out.args.map(simplifyType);
  }
  if ('key' in out && out.key) {
    out.key = simplifyType(out.key);
  }
  if ('val' in out && out.val) {
    out.val = simplifyType(out.val);
  }
  if ('argument' in out && out.argument) {
    out.argument = simplifyType(out.argument);
  }
  return out;
}
export {simplifyType};
