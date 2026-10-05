registerTypedef('Circle', {
  "type": "object",
  "properties": {
    "radius": "number"
  }
});
registerTypedef('Square', {
  "type": "object",
  "properties": {
    "side": "number"
  }
});
registerTypedef('Mode', "string");
registerTypedef('Shape', {
  "type": "condition",
  "checkType": "Mode",
  "extendsType": "string",
  "trueType": "Circle",
  "falseType": "Square"
});
registerTypedef('OtherShape', {
  "type": "condition",
  "checkType": "number",
  "extendsType": "string",
  "trueType": "Circle",
  "falseType": "Square"
});

/**
 * Homomorphic `Partial`/`Required` over decidable conditionals: the condition resolves to a branch first, then the utility applies to the denoted shape. Undecidable conditions stay failed closed. Every throwing call carries `@ts-expect-error`, so a tsc-strict run is green if and only if each directive is consumed and nothing else errors; `*-errors.json` pins the same sequence for RTI.
 */

/**
 * @typedef {object} Circle
 * @property {number} radius
 */

/**
 * @typedef {object} Square
 * @property {number} side
 */

/**
 * @typedef {string} Mode
 */

/**
 * @typedef {Mode extends string ? Circle : Square} Shape
 */

/**
 * @param {Partial<Shape>} x
 */
function takeTrueBranch(x) {
  if (!inspectType(x, {
    "type": "reference",
    "name": "Partial",
    "args": [
      "Shape"
    ],
    "optional": false
  }, 'takeTrueBranch', 'x')) {
    youCanAddABreakpointHere();
  }
  return x;
}
takeTrueBranch({}); // ok

takeTrueBranch({
  radius: 1
}); // ok

// @ts-expect-error: string is not assignable to number

 // ok

// @ts-expect-error: string is not assignable to number
takeTrueBranch({
  radius: 'x'
});

/**
 * @typedef {number extends string ? Circle : Square} OtherShape
 */


/**
 * @param {Partial<OtherShape>} x
 */


/**
 * @typedef {number extends string ? Circle : Square} OtherShape
 */

/**
 * @param {Partial<OtherShape>} x
 */
function takeFalseBranch(x) {
  if (!inspectType(x, {
    "type": "reference",
    "name": "Partial",
    "args": [
      "OtherShape"
    ],
    "optional": false
  }, 'takeFalseBranch', 'x')) {
    youCanAddABreakpointHere();
  }
  return x;
}
takeFalseBranch({}); // ok

takeFalseBranch({
  side: 2
}); // ok

// @ts-expect-error: string is not assignable to number

 // ok

// @ts-expect-error: string is not assignable to number
takeFalseBranch({
  side: 'x'
});

/**
 * @param {Required<Shape>} x
 */

function takeReqCond(x) {
  if (!inspectType(x, {
    "type": "reference",
    "name": "Required",
    "args": [
      "Shape"
    ],
    "optional": false
  }, 'takeReqCond', 'x')) {
    youCanAddABreakpointHere();
  }
  return x;
}
takeReqCond({
  radius: 1
}); // ok

// @ts-expect-error: missing required radius

 // ok

// @ts-expect-error: missing required radius
takeReqCond({});
