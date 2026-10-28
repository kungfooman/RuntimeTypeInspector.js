/**
 * Builtin utility coverage: `Awaited` unwraps promise types to their
 * fulfillment (a Promise is never assignable to its own awaited type),
 * `ReturnType` resolves declared function returns, and the four case
 * intrinsics enforce letter case. Every throwing call carries
 * `@ts-expect-error`, so a tsc-strict run is green if and only if each
 * directive is consumed and nothing else errors.
 */
class Box {
  constructor() {
    /** @type {number} */
    this.v = 1;
  }
}
/**
 * @param {Awaited<Promise<number>>} n
 */
function takeAwaited(n) {
  return n;
}
takeAwaited(1); // ok: the fulfillment type is number
// @ts-expect-error: a Promise is not its own awaited type
takeAwaited(Promise.resolve(1));
// @ts-expect-error: null is no number
takeAwaited(null);
/**
 * @param {Awaited<number>} n
 */
function takeAwaitedPlain(n) {
  return n;
}
takeAwaitedPlain(1); // ok: non-promises are their own awaited type
// @ts-expect-error: strings are no numbers
takeAwaitedPlain('x');
/**
 * @param {ReturnType<() => string>} s
 */
function takeReturned(s) {
  return s;
}
takeReturned('x'); // ok: the declared return is string
// @ts-expect-error: numbers are no strings
takeReturned(1);
/**
 * @param {ReturnType<(a: number) => number>} n
 */
function takeArity(n) {
  return n;
}
takeArity(1); // ok: parameters do not affect the return check
// @ts-expect-error: strings are no numbers
takeArity('x');
/**
 * @param {Uppercase<string>} s
 */
function takeUpper(s) {
  return s;
}
takeUpper('ABC'); // ok
// @ts-expect-error: lowercase is no uppercase
takeUpper('abc');
// @ts-expect-error: non-strings never match
takeUpper(1);
/**
 * @param {Lowercase<string>} s
 */
function takeLower(s) {
  return s;
}
takeLower('abc'); // ok
// @ts-expect-error: uppercase is no lowercase
takeLower('ABC');
/**
 * @param {Capitalize<string>} s
 */
function takeCapital(s) {
  return s;
}
takeCapital('Abc'); // ok
// @ts-expect-error: uncapitalized is no capitalized
takeCapital('abc');
/**
 * @param {Uncapitalize<string>} s
 */
function takeUncapital(s) {
  return s;
}
takeUncapital('aBC'); // ok
// @ts-expect-error: capitalized is no uncapitalized
takeUncapital('Abc');
/**
 * @param {Uppercase<'ab' | 'cd'>} s
 */
function takeUpperUnion(s) {
  return s;
}
takeUpperUnion('AB'); // ok: intrinsics distribute over unions
takeUpperUnion('CD'); // ok
// @ts-expect-error: undistributed members never match
takeUpperUnion('ab');
/**
 * @param {ReadonlyMap<string, number>} m
 */
function takeReadonlyMap(m) {
  return m;
}
takeReadonlyMap(new Map([['a', 1]])); // ok: same shape as Map
// @ts-expect-error: element checks still apply through readonly
takeReadonlyMap(new Map([['a', 'x']]));
// @ts-expect-error: plain objects are no Maps
takeReadonlyMap({});
/**
 * @param {ReadonlySet<number>} s
 */
function takeReadonlySet(s) {
  return s;
}
takeReadonlySet(new Set([1])); // ok: same shape as Set
// @ts-expect-error: element checks still apply through readonly
takeReadonlySet(new Set(['x']));
