registerTypedef('Keys', {
  "type": "object",
  "properties": {
    "a": "number",
    "b": "string"
  }
});

/**
 * `Partial`/`Required` over literal-ish key types: finite template literals enumerate and `keyof` queries pass through untouched, so both behave exactly like their inner type. (Broad spans like `` `on${string}` `` cannot enumerate — a pre-existing base limitation shared with the unmapped shape, not pinned here.) Every throwing call carries `@ts-expect-error`, so a tsc-strict run is green if and only if each directive is consumed and nothing else errors; `*-errors.json` pins the same sequence for RTI.
 */

/**
 * @param {Partial<`on${'click' | 'hover'}`>} x
 */
function takePartialEvent(x) {
  if (!inspectType(x, {
    "type": "reference",
    "name": "Partial",
    "args": [
      {
        "type": "templateLiteral",
        "quasis": [
          "on",
          ""
        ],
        "types": [
          {
            "type": "union",
            "members": [
              "'click'",
              "'hover'"
            ]
          }
        ]
      }
    ],
    "optional": false
  }, 'takePartialEvent', 'x')) {
    youCanAddABreakpointHere();
  }
  return x;
}
takePartialEvent('onclick'); // ok

takePartialEvent('onhover'); // ok

// @ts-expect-error: not a member of the event union

 // ok

// @ts-expect-error: not a member of the event union
takePartialEvent('onmove');
// @ts-expect-error: number is not an event name

takePartialEvent(1);

/**
 * @param {Required<`on${'click' | 'hover'}`>} x
 */

function takeReqEvent(x) {
  if (!inspectType(x, {
    "type": "reference",
    "name": "Required",
    "args": [
      {
        "type": "templateLiteral",
        "quasis": [
          "on",
          ""
        ],
        "types": [
          {
            "type": "union",
            "members": [
              "'click'",
              "'hover'"
            ]
          }
        ]
      }
    ],
    "optional": false
  }, 'takeReqEvent', 'x')) {
    youCanAddABreakpointHere();
  }
  return x;
}
takeReqEvent('onclick'); // ok

// @ts-expect-error: not a member of the event union

 // ok

// @ts-expect-error: not a member of the event union
takeReqEvent('onleave');

/**
 * @typedef {object} Keys
 * @property {number} a
 * @property {string} b
 */


/**
 * @param {Partial<keyof Keys>} x
 */


/**
 * @typedef {object} Keys
 * @property {number} a
 * @property {string} b
 */

/**
 * @param {Partial<keyof Keys>} x
 */
function takePartialKey(x) {
  if (!inspectType(x, {
    "type": "reference",
    "name": "Partial",
    "args": [
      {
        "type": "keyof",
        "argument": "Keys"
      }
    ],
    "optional": false
  }, 'takePartialKey', 'x')) {
    youCanAddABreakpointHere();
  }
  return x;
}
takePartialKey('a'); // ok

// @ts-expect-error: not a key of Keys

 // ok

// @ts-expect-error: not a key of Keys
takePartialKey('z');

/**
 * @param {Required<keyof Keys>} x
 */

function takeReqKey(x) {
  if (!inspectType(x, {
    "type": "reference",
    "name": "Required",
    "args": [
      {
        "type": "keyof",
        "argument": "Keys"
      }
    ],
    "optional": false
  }, 'takeReqKey', 'x')) {
    youCanAddABreakpointHere();
  }
  return x;
}
takeReqKey('b'); // ok

// @ts-expect-error: number is not a key

 // ok

// @ts-expect-error: number is not a key
takeReqKey(1);
