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
  return x;
}
takeAlias(5); // ok: aliases resolve before passthrough
// @ts-expect-error: string is not assignable to number
takeAlias('x');
/**
 * @param {Partial<string>} x
 */
function takeString(x) {
  return x;
}
takeString('hi'); // ok
// @ts-expect-error: number is not assignable to string
takeString(1);
/**
 * @param {Partial<boolean>} x
 */
function takeBoolean(x) {
  return x;
}
takeBoolean(true); // ok
// @ts-expect-error: string is not assignable to boolean
takeBoolean('x');
/**
 * @param {Partial<'a' | 'b'>} x
 */
function takeLiterals(x) {
  return x;
}
takeLiterals('a'); // ok
takeLiterals('b'); // ok
// @ts-expect-error: not a member of the literal union
takeLiterals('c');
/**
 * @param {Required<number>} x
 */
function takeReqNumber(x) {
  return x;
}
takeReqNumber(1); // ok
// @ts-expect-error: empty object is not a number
takeReqNumber({});
/**
 * @param {Partial<() => void>} x
 */
function takeFn(x) {
  return x;
}
takeFn(() => {}); // ok
takeFn(1); // ok: signatures collapse to {} (every non-nullish value passes)
// @ts-expect-error: null is not assignable
takeFn(null);
/**
 * @param {Required<() => void>} x
 */
function takeReqFn(x) {
  return x;
}
takeReqFn(() => {}); // ok
takeReqFn({}); // ok: same collapse
// @ts-expect-error: undefined is not assignable
takeReqFn(undefined);
