/** @import {ExpandedType, ExpandUnionNode} from './expandedType.js' */
/**
 * Checks whether an expanded type node is a union node.
 * `typeof` narrowing does not survive JSDoc typedef unions (they narrow
 * to `never`), so this predicate exists instead of an inline check. The
 * tag alone cannot narrow either: two members (`ExpandParameterNode`,
 * `ExpandAnnotatedAtomNode`) carry no literal `type`, so the tag check
 * would leave them in.
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
    // Untagged members (`ExpandParameterNode`, `ExpandAnnotatedAtomNode`)
    // defeat narrowing, so the tag plus Array check above carries the
    // proof and this cast only reads through it.
    Array.isArray(/** @type {ExpandUnionNode} */ (node).members)
  );
}
export {isUnionNode};
