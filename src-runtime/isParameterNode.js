/**
 * Checks whether an expanded type is an index-signature parameter node.
 * Every `ExpandedType` member carries a literal `type` tag, so the
 * discriminant narrows without structural probing: the old
 * `_.name !== undefined` probe also matched any stray object with a `name`
 * key and misprinted it as `name: type`, while this check fails mistagged
 * nodes through to the generic path instead.
 * @example
 * // input: {type: 'parameter', paramType: 'string', name: 'k'}
 * isParameterNode(expandType('{[k: string]: number}').indexSignatures[0].indexParameters[0]);
 * // true
 * @param {*} node - The expanded type to check.
 * @returns {boolean} Whether it is a parameter node.
 */
function isParameterNode(node) {
  return (
    typeof node === 'object' &&
    node !== null &&
    node.type === 'parameter'
  );
}
export {isParameterNode};
