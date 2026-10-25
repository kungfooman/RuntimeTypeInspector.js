/** @import {ExpandedType, ExpandObjectNode} from './expandedType.js' */
/**
 * Checks whether an expanded type node is an object node.
 * `typeof` narrowing does not survive JSDoc typedef unions (they narrow
 * to `never`), so this predicate exists instead of an inline check. See
 * `isUnionNode` for the full narrowing story.
 * @example
 * const {isObjectNode} = await import("./src-transpiler/isObjectNode.js");
 * const {expandType} = await import("./src-transpiler/expandType.js");
 * isObjectNode(expandType('{a: string}')); // true
 * isObjectNode(expandType('string[]')); // false
 * isObjectNode(undefined); // false
 * @param {ExpandedType | undefined} node - The expanded type node.
 * @returns {node is ExpandObjectNode} Whether it is an object node.
 */
function isObjectNode(node) {
  return typeof node === 'object' && node !== null && node.type === 'object';
}
export {isObjectNode};
