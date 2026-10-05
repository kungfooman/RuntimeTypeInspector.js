/**
 * Every posted message must name a real type: `unchecked` means a template
 * was never inferred.
 * @param {object[]} posted - Captured RTI messages.
 * @returns {boolean} True when no message degrades to `unchecked`.
 * @example
 * noneUnchecked([{strings: ['Expected number']}]); // true
 * noneUnchecked([{strings: ['unchecked type']}]); // false
 */
function noneUnchecked(posted) {
  return posted.every((msg) => !(msg.strings ?? []).join(' ').includes('unchecked'));
}
export {noneUnchecked};
