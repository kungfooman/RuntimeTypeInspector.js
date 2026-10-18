/**
 * Answers whether a value fails the `number` check, including the
 * `+-Infinity` rejection that catches `NaN` precursors such as
 * `Infinity - Infinity` or `Infinity % 2`. Pure decision helper without
 * warnings or recursion, so hot scan loops can pre-pick it once and run
 * it per element: verdicts match the plain-number part of
 * `validateNumber`, and messaging stays with the validator loop. The
 * Infinity part is unconditional in this variant, so only callers that
 * already decided Infinity counts as failing should use it. Needed in
 * this form because `validateNumber` itself also reports and needs the
 * full argument set, which would hide the cheap check inside one
 * function shape.
 * @param {*} x - The value to inspect.
 * @returns {boolean} True when the value fails the number check.
 * @example
 * isFailingNumberDisallowingInf(NaN); // true (NaN precursor reporting)
 * isFailingNumberDisallowingInf(Infinity); // true (finite wanted)
 * isFailingNumberDisallowingInf(0); // false
 * isFailingNumberDisallowingInf('1'); // true (strictly wants `number`, no coercion)
 * isFailingNumberDisallowingInf(new Number(1)); // true (boxed numbers are not numbers)
 */
function isFailingNumberDisallowingInf(x) {
  return typeof x !== 'number' || Number.isNaN(x) || !Number.isFinite(x);
}
export {isFailingNumberDisallowingInf};
