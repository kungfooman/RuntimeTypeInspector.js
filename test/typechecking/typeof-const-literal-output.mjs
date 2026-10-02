registerTypedef('JointMotion', {
  "type": "union",
  "members": [
    {
      "type": "typeof",
      "argument": "MOTION_FREE"
    },
    {
      "type": "typeof",
      "argument": "MOTION_LIMITED"
    },
    {
      "type": "typeof",
      "argument": "MOTION_LOCKED"
    }
  ]
});

/**
 * `typeof` over values follows tsc widening: `const` bindings keep literal
 * types (`typeof MOTION_FREE` is `'free'`, the engine#9613 `JointMotion`
 * pattern), `let`/`var` widen (`typeof count` is `number`). Every throwing
 * call carries `@ts-expect-error`, so a tsc-strict run is green if and
 * only if each directive is consumed and nothing else errors;
 * `*-errors.json` pins the same sequence for RTI.
 */
export const MOTION_FREE = 'free';
registerVariable('MOTION_FREE', MOTION_FREE, 'const');

export const MOTION_LIMITED = 'limited';
registerVariable('MOTION_LIMITED', MOTION_LIMITED, 'const');

export const MOTION_LOCKED = 'locked';
registerVariable('MOTION_LOCKED', MOTION_LOCKED, 'const');


/**
 * @typedef {typeof MOTION_FREE | typeof MOTION_LIMITED | typeof MOTION_LOCKED} JointMotion
 */


/**
 * @param {JointMotion} motion - The motion to set.
 */


/**
 * @typedef {typeof MOTION_FREE | typeof MOTION_LIMITED | typeof MOTION_LOCKED} JointMotion
 */

/**
 * @param {JointMotion} motion - The motion to set.
 */
function setMotion(motion) {
  if (!inspectType(motion, "JointMotion", 'setMotion', 'motion')) {
    youCanAddABreakpointHere();
  }
  return motion;
}
setMotion('free'); // ok

setMotion('limited'); // ok

// @ts-expect-error: not one of the motion literals

 // ok

// @ts-expect-error: not one of the motion literals
setMotion('bogus');
// @ts-expect-error: wrong primitive kind

setMotion(1);
export const ANSWER = 42;
registerVariable('ANSWER', ANSWER, 'const');


/**
 * @param {typeof ANSWER} value - The answer.
 */

function takeAnswer(value) {
  if (!inspectType(value, {
    "type": "typeof",
    "argument": "ANSWER",
    "optional": false
  }, 'takeAnswer', 'value')) {
    youCanAddABreakpointHere();
  }
  return value;
}
takeAnswer(42); // ok

// @ts-expect-error: typeof ANSWER is 42

 // ok

// @ts-expect-error: typeof ANSWER is 42
takeAnswer(43);
let count = 5;
registerVariable('count', count, 'let');


/**
 * @param {typeof count} value - The count.
 */

function takeCount(value) {
  if (!inspectType(value, {
    "type": "typeof",
    "argument": "count",
    "optional": false
  }, 'takeCount', 'value')) {
    youCanAddABreakpointHere();
  }
  return value;
}
takeCount(6); // ok: let widens to number

// @ts-expect-error: typeof count is number

 // ok: let widens to number

// @ts-expect-error: typeof count is number
takeCount('6');
