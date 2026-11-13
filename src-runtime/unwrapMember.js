/**
 * Unwraps tuple element decorations (`tupleMember`, `rest`) to the inner type.
 * @param {*} element - Raw tuple element.
 * @returns {*} Unwrapped type.
 * @example
 * unwrapMember({type: 'rest', annotation: 'K'}); // 'K'
 */
function unwrapMember(element) {
  const isWrapped = element.type === 'tupleMember' || element.type === 'rest';
  if (element && typeof element === 'object' && isWrapped) {
    return element.elementType ?? element.annotation;
  }
  return element;
}
export {unwrapMember};
