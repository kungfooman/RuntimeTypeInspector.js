/** @import {ExpandedType} from './expandedType.js' */
/**
 * Checks whether an expanded type node is an array node.
 * `typeof` narrowing does not survive JSDoc typedef unions (they narrow
 * to `never`), so this predicate exists instead of an inline check. See
 * `isUnionNode` for the full narrowing story.
 * @example
 * const {isArrayNode} = await import("./src-transpiler/isArrayNode.js");
 * const {expandType} = await import("./src-transpiler/expandType.js");
 * isArrayNode(expandType('string[]')); // true
 * isArrayNode(expandType('string | number')); // false
 * isArrayNode(undefined); // false
 * @param {ExpandedType | undefined} node - The expanded type node.
 * @returns {node is {type: 'array', elementType: ExpandedType}} Whether it is an array node.
 */
function isArrayNode(node) {
  return typeof node === 'object' && node !== null && node.type === 'array';
}
export {isArrayNode};
