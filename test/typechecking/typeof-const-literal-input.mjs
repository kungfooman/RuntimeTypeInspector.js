/**
 * `typeof` over values follows tsc widening: `const` bindings keep literal
 * types (`typeof MOTION_FREE` is `'free'`, the engine#9613 `JointMotion`
 * pattern), `let`/`var` widen (`typeof count` is `number`). Every throwing
 * call carries `@ts-expect-error`, so a tsc-strict run is green if and
 * only if each directive is consumed and nothing else errors;
 * `*-errors.json` pins the same sequence for RTI.
 */
export const MOTION_FREE = 'free';
export const MOTION_LIMITED = 'limited';
export const MOTION_LOCKED = 'locked';
/**
 * @typedef {typeof MOTION_FREE | typeof MOTION_LIMITED | typeof MOTION_LOCKED} JointMotion
 */
/**
 * @param {JointMotion} motion - The motion to set.
 */
function setMotion(motion) {
  return motion;
}
setMotion('free'); // ok
setMotion('limited'); // ok
// @ts-expect-error: not one of the motion literals
setMotion('bogus');
// @ts-expect-error: wrong primitive kind
setMotion(1);
export const ANSWER = 42;
/**
 * @param {typeof ANSWER} value - The answer.
 */
function takeAnswer(value) {
  return value;
}
takeAnswer(42); // ok
// @ts-expect-error: typeof ANSWER is 42
takeAnswer(43);
let count = 5;
/**
 * @param {typeof count} value - The count.
 */
function takeCount(value) {
  return value;
}
takeCount(6); // ok: let widens to number
// @ts-expect-error: typeof count is number
takeCount('6');
