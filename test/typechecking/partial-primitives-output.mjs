registerTypedef('Id', "number");

/**
 * Homomorphic `Partial`/`Required` over primitives, literals, aliases and functions: primitives pass straight through while bare signatures collapse to `{}` (every non-nullish value passes, nullish fails) — both matching TypeScript instead of rejecting every value. Every throwing call carries `@ts-expect-error`, so a tsc-strict run is green if and only if each directive is consumed and nothing else errors; `*-errors.json` pins the same sequence for RTI.
 */

/**
 * @typedef {number} Id
 */

/**
 * @param {Partial<Id>} x
 */
function takeAlias(x) {
  if (!inspectType(x, {
    "type": "reference",
    "name": "Partial",
    "args": [
      "Id"
    ],
    "optional": false
  }, 'takeAlias', 'x')) {
    youCanAddABreakpointHere();
  }
  return x;
}
takeAlias(5); // ok: aliases resolve before passthrough

// @ts-expect-error: string is not assignable to number

 // ok: aliases resolve before passthrough

// @ts-expect-error: string is not assignable to number
takeAlias('x');

/**
 * @param {Partial<string>} x
 */

function takeString(x) {
  if (!inspectType(x, {
    "type": "reference",
    "name": "Partial",
    "args": [
      "string"
    ],
    "optional": false
  }, 'takeString', 'x')) {
    youCanAddABreakpointHere();
  }
  return x;
}
takeString('hi'); // ok

// @ts-expect-error: number is not assignable to string

 // ok

// @ts-expect-error: number is not assignable to string
takeString(1);

/**
 * @param {Partial<boolean>} x
 */

function takeBoolean(x) {
  if (!inspectType(x, {
    "type": "reference",
    "name": "Partial",
    "args": [
      "boolean"
    ],
    "optional": false
  }, 'takeBoolean', 'x')) {
    youCanAddABreakpointHere();
  }
  return x;
}
takeBoolean(true); // ok

// @ts-expect-error: string is not assignable to boolean

 // ok

// @ts-expect-error: string is not assignable to boolean
takeBoolean('x');

/**
 * @param {Partial<'a' | 'b'>} x
 */

function takeLiterals(x) {
  if (!inspectType(x, {
    "type": "reference",
    "name": "Partial",
    "args": [
      {
        "type": "union",
        "members": [
          "'a'",
          "'b'"
        ]
      }
    ],
    "optional": false
  }, 'takeLiterals', 'x')) {
    youCanAddABreakpointHere();
  }
  return x;
}
takeLiterals('a'); // ok

takeLiterals('b'); // ok

// @ts-expect-error: not a member of the literal union

 // ok

// @ts-expect-error: not a member of the literal union
takeLiterals('c');

/**
 * @param {Required<number>} x
 */

function takeReqNumber(x) {
  if (!inspectType(x, {
    "type": "reference",
    "name": "Required",
    "args": [
      "number"
    ],
    "optional": false
  }, 'takeReqNumber', 'x')) {
    youCanAddABreakpointHere();
  }
  return x;
}
takeReqNumber(1); // ok

// @ts-expect-error: empty object is not a number

 // ok

// @ts-expect-error: empty object is not a number
takeReqNumber({});

/**
 * @param {Partial<any>} x
 */

function takePartialAny(x) {
  if (!inspectType(x, {
    "type": "reference",
    "name": "Partial",
    "args": [
      "any"
    ],
    "optional": false
  }, 'takePartialAny', 'x')) {
    youCanAddABreakpointHere();
  }
  return x;
}
takePartialAny({}); // ok: signature bag admits objects

takePartialAny([1]); // ok

// @ts-expect-error: number is not assignable to the signature bag

 // ok

// @ts-expect-error: number is not assignable to the signature bag
takePartialAny(1);
// @ts-expect-error: null is not assignable

takePartialAny(null);

/**
 * @param {Partial<unknown>} x
 */

function takePartialUnknown(x) {
  if (!inspectType(x, {
    "type": "reference",
    "name": "Partial",
    "args": [
      "unknown"
    ],
    "optional": false
  }, 'takePartialUnknown', 'x')) {
    youCanAddABreakpointHere();
  }
  return x;
}
takePartialUnknown(1); // ok: unknown maps over never keys, like {}

takePartialUnknown({}); // ok

// @ts-expect-error: null is not assignable

 // ok

// @ts-expect-error: null is not assignable
takePartialUnknown(null);

/**
 * @param {Partial<() => void>} x
 */

function takeFn(x) {
  if (!inspectType(x, {
    "type": "reference",
    "name": "Partial",
    "args": [
      {
        "type": "function",
        "parameters": []
      }
    ],
    "optional": false
  }, 'takeFn', 'x')) {
    youCanAddABreakpointHere();
  }
  return x;
}
takeFn(() => {}); // ok

takeFn(1); // ok: signatures collapse to {} (every non-nullish value passes)

// @ts-expect-error: null is not assignable

 // ok: signatures collapse to {} (every non-nullish value passes)

// @ts-expect-error: null is not assignable
takeFn(null);

/**
 * @param {Required<() => void>} x
 */

function takeReqFn(x) {
  if (!inspectType(x, {
    "type": "reference",
    "name": "Required",
    "args": [
      {
        "type": "function",
        "parameters": []
      }
    ],
    "optional": false
  }, 'takeReqFn', 'x')) {
    youCanAddABreakpointHere();
  }
  return x;
}
takeReqFn(() => {}); // ok

takeReqFn({}); // ok: same collapse

// @ts-expect-error: undefined is not assignable

 // ok: same collapse

// @ts-expect-error: undefined is not assignable
takeReqFn(undefined);
