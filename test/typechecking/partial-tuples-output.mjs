
/**
 * Homomorphic `Partial`/`Required` over tuples: tuples stay tuples. `Partial<[number, string]>` is `[(number | undefined)?, (string | undefined)?]` and `Required` strips member optionality while keeping element types (including `| undefined`). Every throwing call carries `@ts-expect-error`, so a tsc-strict run is green if and only if each directive is consumed and nothing else errors; `*-errors.json` pins the same sequence for RTI.
 */

/**
 * @param {Partial<[number, string]>} x
 */
function takePartialTuple(x) {
  if (!inspectType(x, {
    "type": "reference",
    "name": "Partial",
    "args": [
      {
        "type": "tuple",
        "elements": [
          "number",
          "string"
        ]
      }
    ],
    "optional": false
  }, 'takePartialTuple', 'x')) {
    youCanAddABreakpointHere();
  }
  return x;
}
takePartialTuple([1, 's']); // ok

takePartialTuple([1, undefined]); // ok: members turn undefined-able

takePartialTuple([1]); // ok: trailing members turn optional

// @ts-expect-error: string is not assignable to number

 // ok: trailing members turn optional

// @ts-expect-error: string is not assignable to number
takePartialTuple(['s', 's']);
// @ts-expect-error: plain object is not a tuple

takePartialTuple({});

/**
 * @param {Required<[number, string]>} x
 */

function takeReqTuple(x) {
  if (!inspectType(x, {
    "type": "reference",
    "name": "Required",
    "args": [
      {
        "type": "tuple",
        "elements": [
          "number",
          "string"
        ]
      }
    ],
    "optional": false
  }, 'takeReqTuple', 'x')) {
    youCanAddABreakpointHere();
  }
  return x;
}
takeReqTuple([1, 's']); // ok

// @ts-expect-error: string is not assignable to number

 // ok

// @ts-expect-error: string is not assignable to number
takeReqTuple(['s', 's']);
// @ts-expect-error: tuples need both members

takeReqTuple([1]);
