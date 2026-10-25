/** @import {ExpandedType, ExpandIndexSignatureNode} from './expandedType.js' */
/**
 * Checks whether an expanded type is an index signature node. Every member
 * of the union carries a literal `type` tag, so the discriminant narrows
 * without structural probing. The `Array` check on `indexParameters` keeps
 * the `map` in `simplifyType` total over corrupt shapes. `typeof`
 * narrowing does not survive JSDoc typedef unions (they narrow to
 * `never`), which is why the object check lives here rather than inline
 * at the call site.
 * @example
 * const {isIndexSignatureNode} = await import("./src-transpiler/isIndexSignatureNode.js");
 * const {expandType} = await import("./src-transpiler/expandType.js");
 * isIndexSignatureNode(expandType('{[n: number]: string}')); // false, the object is not itself the signature
 * isIndexSignatureNode({type: 'indexSignature', indexType: 'string', indexParameters: []}); // true
 * isIndexSignatureNode('string'); // false
 * @param {ExpandedType | undefined} type - The expanded type to check.
 * @returns {type is ExpandIndexSignatureNode} Whether the type is an index signature node.
 */
function isIndexSignatureNode(type) {
  return (
    typeof type === 'object' &&
    type !== null &&
    type.type === 'indexSignature' &&
    Array.isArray(type.indexParameters)
  );
}
export {isIndexSignatureNode};
