/**
 * Effective type of a tuple element: `tupleMember` decorations unwrap to
 * the inner type, everything else passes through. Shared with the
 * explainer so breakdowns agree with validation by construction.
 * @param {*} el - Raw tuple element.
 * @returns {*} Effective element type.
 * @example
 * tupleEffective({type: 'tupleMember', elementType: 'number'}); // 'number'
 */
function tupleEffective(el) {
  if (el && typeof el === 'object' && el.type === 'tupleMember') return el.elementType;
  return el;
}
export {tupleEffective};
