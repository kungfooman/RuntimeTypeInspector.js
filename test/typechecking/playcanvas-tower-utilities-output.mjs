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
        "\"a\""
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
takePartial({});
takePartial({
  a: 1
});
takePartial({
  a: 'x'
});

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
takeDeep({});
takeDeep({
  a: 1
});
takeDeep({
  a: 'x'
});

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
});
takeRequired({});

/**
 * @param {Omit<Partial<Box|Box2>, 'a'>} o
 */

function takeOmitUnion(o) {
  if (!inspectType(o, {
    "type": "reference",
    "name": "Omit",
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
      },
      "'a'"
    ],
    "optional": false
  }, 'takeOmitUnion', 'o')) {
    youCanAddABreakpointHere();
  }
  return o;
}
takeOmitUnion({
  b: 's'
});
takeOmitUnion({
  c: true
});
takeOmitUnion({
  a: 1
});
takeOmitUnion({
  b: 1
});

/**
 * @template T
 * @typedef {Partial<Pick<T, "a">>} OptA
 */


/**
 * @param {OptA<Box>} o
 */


/**
 * @template T
 * @typedef {Partial<Pick<T, "a">>} OptA
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
});
takeGeneric({});
takeGeneric({
  a: 'x'
});
