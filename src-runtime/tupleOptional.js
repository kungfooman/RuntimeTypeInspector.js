/**
 * Whether a tuple element may be absent: `tupleMember` with `optional`.
 * Shared with the explainer (see `tupleEffective`).
 * @param {*} el - Raw tuple element.
 * @returns {boolean} True when absence is allowed.
 * @example
 * tupleOptional({type: 'tupleMember', elementType: 'number', optional: true}); // true
 */
function tupleOptional(el) {
  return !!(el && typeof el === 'object' && el.type === 'tupleMember' && el.optional);
}
export {tupleOptional};
