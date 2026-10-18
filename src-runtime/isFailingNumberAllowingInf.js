/**
 * Same number check as `isFailingNumberDisallowingInf` with the `+-Infinity` part left
 * out on purpose: this variant exists for callers whose checking of
 * infinities is turned off (`options.checkInfinity === false`), where
 * infinities pass `number`. The pair lets scan loops pre-pick one
 * predicate before iterating instead of threading a boolean through
 * every call. Verdicts line up with `validateNumber` under that option.
 * @param {*} x - The value to inspect.
 * @returns {boolean} True when the value fails the number check.
 * @example
 * isFailingNumberAllowingInf(NaN); // true
 * isFailingNumberAllowingInf(Infinity); // false
 * isFailingNumberAllowingInf(-Infinity); // false
 * isFailingNumberAllowingInf('1'); // true (strictly wants `number`)
 * isFailingNumberAllowingInf(0); // false
 */
function isFailingNumberAllowingInf(x) {
  return typeof x !== 'number' || Number.isNaN(x);
}
export {isFailingNumberAllowingInf};
