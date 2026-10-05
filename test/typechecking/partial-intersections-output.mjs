registerTypedef('HasA', {
  "type": "object",
  "properties": {
    "a": "number"
  }
});
registerTypedef('HasB', {
  "type": "object",
  "properties": {
    "b": "string"
  }
});

/**
 * Homomorphic `Partial`/`Required` (plus `Pick`/`Omit`) over intersections: member shapes merge before the utility applies, mirroring how key reads merge intersections. Members that resolve to anything but exactly one shape stay failed closed. Every throwing call carries `@ts-expect-error`, so a tsc-strict run is green if and only if each directive is consumed and nothing else errors; `*-errors.json` pins the same sequence for RTI.
 */

/**
 * @typedef {object} HasA
 * @property {number} a
 */

/**
 * @typedef {object} HasB
 * @property {string} b
 */

/**
 * @param {Partial<HasA & HasB>} x
 */
function takePartialIntersect(x) {
  if (!inspectType(x, {
    "type": "reference",
    "name": "Partial",
    "args": [
      {
        "type": "intersection",
        "members": [
          "HasA",
          "HasB"
        ]
      }
    ],
    "optional": false
  }, 'takePartialIntersect', 'x')) {
    youCanAddABreakpointHere();
  }
  return x;
}
takePartialIntersect({}); // ok

takePartialIntersect({
  a: 1,
  b: 's'
}); // ok: members merge

// @ts-expect-error: string is not assignable to number

 // ok: members merge

// @ts-expect-error: string is not assignable to number
takePartialIntersect({
  a: 'x',
  b: 's'
});

/**
 * @param {Required<HasA & HasB>} x
 */

function takeReqIntersect(x) {
  if (!inspectType(x, {
    "type": "reference",
    "name": "Required",
    "args": [
      {
        "type": "intersection",
        "members": [
          "HasA",
          "HasB"
        ]
      }
    ],
    "optional": false
  }, 'takeReqIntersect', 'x')) {
    youCanAddABreakpointHere();
  }
  return x;
}
takeReqIntersect({
  a: 1,
  b: 's'
}); // ok

// @ts-expect-error: missing required members

 // ok

// @ts-expect-error: missing required members
takeReqIntersect({});
// @ts-expect-error: number is not assignable to string

takeReqIntersect({
  a: 1,
  b: 2
});

/**
 * @param {Pick<HasA & HasB, 'a'>} x
 */

function takePickIntersect(x) {
  if (!inspectType(x, {
    "type": "reference",
    "name": "Pick",
    "args": [
      {
        "type": "intersection",
        "members": [
          "HasA",
          "HasB"
        ]
      },
      "'a'"
    ],
    "optional": false
  }, 'takePickIntersect', 'x')) {
    youCanAddABreakpointHere();
  }
  return x;
}
takePickIntersect({
  a: 1
}); // ok

// @ts-expect-error: string is not assignable to number

 // ok

// @ts-expect-error: string is not assignable to number
takePickIntersect({
  a: 'x'
});

/**
 * @param {Omit<HasA & HasB, 'a'>} x
 */

function takeOmitIntersect(x) {
  if (!inspectType(x, {
    "type": "reference",
    "name": "Omit",
    "args": [
      {
        "type": "intersection",
        "members": [
          "HasA",
          "HasB"
        ]
      },
      "'a'"
    ],
    "optional": false
  }, 'takeOmitIntersect', 'x')) {
    youCanAddABreakpointHere();
  }
  return x;
}
takeOmitIntersect({
  b: 's'
}); // ok

// @ts-expect-error: a was omitted

 // ok

// @ts-expect-error: a was omitted
takeOmitIntersect({
  a: 1,
  b: 's'
});
