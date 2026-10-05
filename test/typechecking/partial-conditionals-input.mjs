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
  return x;
}
takeTrueBranch({}); // ok
takeTrueBranch({ radius: 1 }); // ok
// @ts-expect-error: string is not assignable to number
takeTrueBranch({ radius: 'x' });
/**
 * @typedef {number extends string ? Circle : Square} OtherShape
 */
/**
 * @param {Partial<OtherShape>} x
 */
function takeFalseBranch(x) {
  return x;
}
takeFalseBranch({}); // ok
takeFalseBranch({ side: 2 }); // ok
// @ts-expect-error: string is not assignable to number
takeFalseBranch({ side: 'x' });
/**
 * @param {Required<Shape>} x
 */
function takeReqCond(x) {
  return x;
}
takeReqCond({ radius: 1 }); // ok
// @ts-expect-error: missing required radius
takeReqCond({});
