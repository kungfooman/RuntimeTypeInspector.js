registerTypedef('Box', {
  "type": "object",
  "properties": {
    "a": "number",
    "b": "string"
  }
});
registerTypedef('Box2', {
  "type": "object",
  "properties": {
    "a": "number",
    "c": "boolean"
  }
});
registerTypedef('OptA', {
  "type": "reference",
  "name": "Partial",
  "args": [
    {
      "type": "reference",
      "name": "Pick",
      "args": [
        "T",
        {
          "type": "reference",
          "name": "Extract",
          "args": [
            {
              "type": "union",
              "members": [
                "\"a\"",
                "\"b\""
              ]
            },
            {
              "type": "keyof",
              "argument": "T"
            }
          ]
        }
      ]
    }
  ]
}, ["T"]);

/**
 * Nested utility validation: `Partial`, `Pick`, `Omit` and `Required`
 * compose (including over unions and behind generic wrappers) instead of
 * rejecting their argument outright.
 */

/**
 * @typedef {{ a: number, b: string }} Box
 */

/**
 * @typedef {{ a: number, c: boolean }} Box2
 */

/**
 * @param {Partial<Box>} o
 */
function takePartial(o) {
  if (!inspectType(o, {
    "type": "reference",
    "name": "Partial",
    "args": [
      "Box"
    ],
    "optional": false
  }, 'takePartial', 'o')) {
    youCanAddABreakpointHere();
  }
  return o;
}
takePartial({}); // Expected: no issue — all props optional

takePartial({
  a: 1
}); // Expected: no issue

takePartial({
  a: 'x'
}); // Expected: error — 'a' must be a number


/**
 * @param {Partial<Partial<Box>>} o
 */

function takeDeep(o) {
  if (!inspectType(o, {
    "type": "reference",
    "name": "Partial",
    "args": [
      {
        "type": "reference",
        "name": "Partial",
        "args": [
          "Box"
        ]
      }
    ],
    "optional": false
  }, 'takeDeep', 'o')) {
    youCanAddABreakpointHere();
  }
  return o;
}
takeDeep({}); // Expected: no issue

takeDeep({
  a: 1
}); // Expected: no issue

takeDeep({
  a: 'x'
}); // Expected: error — 'a' must be a number


/**
 * @param {Required<Partial<Box>>} o
 */

function takeRequired(o) {
  if (!inspectType(o, {
    "type": "reference",
    "name": "Required",
    "args": [
      {
        "type": "reference",
        "name": "Partial",
        "args": [
          "Box"
        ]
      }
    ],
    "optional": false
  }, 'takeRequired', 'o')) {
    youCanAddABreakpointHere();
  }
  return o;
}
takeRequired({
  a: 1,
  b: 's'
}); // Expected: no issue

takeRequired({}); // Expected: error — 'a' and 'b' are required


/**
 * @param {Omit<Partial<Box>, 'a'>} o
 */

function takeOmit(o) {
  if (!inspectType(o, {
    "type": "reference",
    "name": "Omit",
    "args": [
      {
        "type": "reference",
        "name": "Partial",
        "args": [
          "Box"
        ]
      },
      "'a'"
    ],
    "optional": false
  }, 'takeOmit', 'o')) {
    youCanAddABreakpointHere();
  }
  return o;
}
takeOmit({
  b: 's'
}); // Expected: no issue

takeOmit({
  a: 1
}); // Expected: error — 'a' was omitted

takeOmit({
  b: 1
}); // Expected: error — 'b' must be a string


/**
 * @param {Required<Partial<Box|Box2>>} o
 */

function takeRequiredUnion(o) {
  if (!inspectType(o, {
    "type": "reference",
    "name": "Required",
    "args": [
      {
        "type": "reference",
        "name": "Partial",
        "args": [
          {
            "type": "union",
            "members": [
              "Box",
              "Box2"
            ]
          }
        ]
      }
    ],
    "optional": false
  }, 'takeRequiredUnion', 'o')) {
    youCanAddABreakpointHere();
  }
  return o;
}
takeRequiredUnion({
  a: 1,
  b: 's'
}); // Expected: no issue

takeRequiredUnion({
  a: 1,
  c: true
}); // Expected: no issue

takeRequiredUnion({}); // Expected: error — 'a' is required


/**
 * @template T
 * @typedef {Partial<Pick<T, Extract<"a"|"b", keyof T>>>} OptA
 */


/**
 * @param {OptA<Box>} o
 */


/**
 * @template T
 * @typedef {Partial<Pick<T, Extract<"a"|"b", keyof T>>>} OptA
 */

/**
 * @param {OptA<Box>} o
 */
function takeGeneric(o) {
  if (!inspectType(o, {
    "type": "reference",
    "name": "OptA",
    "args": [
      "Box"
    ],
    "optional": false
  }, 'takeGeneric', 'o')) {
    youCanAddABreakpointHere();
  }
  return o;
}
takeGeneric({
  a: 1
}); // Expected: no issue

takeGeneric({
  b: 's'
}); // Expected: no issue

takeGeneric({
  c: 1
}); // Expected: error — 'c' is unknown

takeGeneric({
  a: 'x'
}); // Expected: error — 'a' must be a number

