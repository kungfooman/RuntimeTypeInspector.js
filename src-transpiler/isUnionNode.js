/** @import {ExpandedType} from './expandedType.js' */
/**
 * Checks whether an expanded type node is a union node.
 * `typeof` narrowing does not survive JSDoc typedef unions (they narrow
 * to `never`), so this predicate exists instead of an inline check. Every
 * member carries a literal `type` tag, so the discriminant narrows without
 * structural probing.
 * @example
 * const {isUnionNode} = await import("./src-transpiler/isUnionNode.js");
 * const {expandType} = await import("./src-transpiler/expandType.js");
 * isUnionNode(expandType('string | number')); // true
 * isUnionNode(expandType('string[]')); // false
 * isUnionNode(undefined); // false
 * @param {ExpandedType | undefined} node - The expanded type node.
 * @returns {node is {type: 'union', members: ExpandedType[]}} Whether it is a union node.
 */
function isUnionNode(node) {
  return (
    typeof node === 'object' &&
    node !== null &&
    node.type === 'union' &&
    Array.isArray(node.members)
  );
}
export {isUnionNode};
