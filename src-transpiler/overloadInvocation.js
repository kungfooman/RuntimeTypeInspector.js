/**
 * Renders the call that forwards a wrapper invocation to its inner arrow.
 * The suffix closes the inner call and the wrapper block. The name
 * wrapper closer follows separately.
 * @param {object|null} wrapper - Dummy head with the invocation shape.
 * @returns {string} Invocation suffix for the inner arrow.
 * @example
 * overloadInvocation({invocation: 'rtiParam0, ...rtiParam1'}); // closes inner call plus wrapper block
 */
function overloadInvocation(wrapper) {
  if (!wrapper) {
    return '';
  }
  return ')(' + wrapper.invocation + ')}';
}
export {overloadInvocation};
