/** @import {ExpandedType} from './expandedType.js' */
/**
 * Checks whether an expanded type is an object node (flag-carrying), as
 * opposed to a bare atom (string, number, boolean) or undefined.
 * Every object node carries the optional `optional`/`readonly` flags, so
 * a positive check lets callers write flags with no cast. `typeof`
 * narrowing does not survive JSDoc typedef unions (they narrow to
 * `never`), which is why this predicate exists instead of an inline
 * `typeof` check.
 * @example
 * const {isExpandedObject} = await import("./src-transpiler/isExpandedObject.js");
 * const {expandType} = await import("./src-transpiler/expandType.js");
 * isExpandedObject(expandType('{a: string}')); // true
 * isExpandedObject(expandType('string')); // false
 * isExpandedObject(undefined); // false
 * @param {ExpandedType | undefined} type - The expanded type to check.
 * @returns {type is {optional?: boolean, readonly?: boolean}} Whether the type is a flag-carrying object node.
 */
function isExpandedObject(type) {
  return typeof type === 'object' && type !== null;
}
export {isExpandedObject};
