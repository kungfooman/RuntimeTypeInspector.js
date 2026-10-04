/**
 * Unwraps tuple element decorations (`tupleMember`, `rest`) to the inner type.
 * @param {*} element - Raw tuple element.
 * @returns {*} Unwrapped type.
 * @example
 * unwrapMember({type: 'rest', annotation: 'K'}); // 'K'
 */
function unwrapMember(element) {
  if (element && typeof element === 'object' && (element.type === 'tupleMember' || element.type === 'rest')) {
    return element.elementType ?? element.annotation;
  }
  return element;
}
export {unwrapMember};
