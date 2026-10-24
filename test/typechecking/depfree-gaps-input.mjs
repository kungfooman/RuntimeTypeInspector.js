/**
 * Dep-free parser gap closures: every throwing call carries
 * `@ts-expect-error`, so a tsc-strict run is green if and only if each
 * directive is consumed and nothing else errors; `*-errors.json` pins the
 * same sequence for RTI.
 */
/**
 * @param {(a: number) => string} f
 */
function takeFn(f) {
  return f;
}
/**
 * @param {number} a
 * @returns {string}
 */
function numToString(a) {
  return String(a);
}
takeFn(numToString); // ok
// @ts-expect-error: number is not assignable to string
takeFn(1);
/**
 * @param {new (a: number) => any} C
 */
function takeNew(C) {
  return C;
}
takeNew(class Box {
  /**
   * @param {number} a
   */
  constructor(a) { this.a = a; }
}); // ok
// @ts-expect-error: number is not a constructor
takeNew(1);
/**
 * @param {{a?: string, readonly b: number}} o
 */
function takeFlags(o) {
  return o;
}
takeFlags({b: 1}); // ok: a is optional
takeFlags({a: 'x', b: 1}); // ok
// @ts-expect-error: b is missing
takeFlags({a: 'x'});
/**
 * @param {{[n: number]: string}} m
 */
function takeIndex(m) {
  return m;
}
takeIndex({0: 'a'}); // ok
// @ts-expect-error: non-numeric key with a number index
takeIndex({a: 'x'});
/**
 * @param {123n} b
 */
function takeBigint(b) {
  return b;
}
takeBigint(123n); // ok
// @ts-expect-error: number is not a bigint literal
takeBigint(123);
/**
 * @param {`id`} t
 */
function takeTemplate(t) {
  return t;
}
takeTemplate('id'); // ok
// @ts-expect-error: wrong literal
takeTemplate('xx');
/**
 * @param {[first: string, ...rest: number[]]} t
 */
function takeNamedTuple(t) {
  return t;
}
takeNamedTuple(['a', 1, 2]); // ok
takeNamedTuple(['a']); // ok: rest may be empty
// @ts-expect-error: string is not assignable to number
takeNamedTuple(['a', 'b']);
