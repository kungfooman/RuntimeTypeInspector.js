/**
 * Freshness beyond the top level: calls nested inside function bodies, spread
 * tolerance, assignment values and default parameters. Every throwing call
 * carries `@ts-expect-error`, so a tsc-strict run is green if and only if
 * each directive is consumed and nothing else errors. Runtime checking only
 * sees values that flow: a ternary reports the branch taken (tsc unions both
 * branches statically), and literals that never reach a checked call (a
 * factory return, an element pushed then read back) keep the mark of their
 * creation site instead of the use site. Spread results still run the
 * weak-type gate, sequence tails, logical fallbacks, parenthesized
 * literals, new-expression args and index-signature values, and symbol
 * keys plus non-object spreads stay out of scope.
 */
/**
  * @param {{x: number}} o
  */
function takeFresh(o) {
  return o;
}
takeFresh({x: 1}); /* ok: exact fresh literal */
// @ts-expect-error: fresh excess key
takeFresh({x: 1, extra: 1});
function outer() {
  // @ts-expect-error: calls inside bodies check their own literals
  takeFresh({x: 1, extra: 2});
}
outer();
function* producer() {
  // @ts-expect-error: yielded call args check like any other call site
  yield takeFresh({x: 1, extra: 3});
}
producer().next();
let saved;
/* @ts-expect-error: assignment value is a fresh literal */
takeFresh(saved = {x: 1, extra: 4});
/**
  * @param {{x: number}} [o]
  */
function takeDefault(
  // @ts-expect-error: default value is a fresh literal
  o = {x: 1, extra: 5},
) {
  return o;
}
/* default value flows in and fails at runtime */
takeDefault();
const staleBag = {y: 1};
takeFresh({x: 1, ...staleBag}); /* ok: tsc forgives keys arriving through spread */
/* @ts-expect-error: written keys still count beside a spread */
takeFresh({x: 1, extra: 6, ...staleBag});
/* @ts-expect-error: missing required key, never an excess fail */
takeFresh({...staleBag});
/**
  * @typedef {{a: number, b: string}} HHBox
  * @typedef {Partial<HHBox>} HHPartial
  */
/** @param {HHPartial} x */
function takeWeak(x) {
  return x;
}
const unknownBag = {zzz: 9};
const overlappingBag = {a: 1, zzz: 9};
/* @ts-expect-error: spread shares no key with the weak shape (tsc TS2559) */
takeWeak({...unknownBag});
takeWeak({...overlappingBag}); /* ok: the spread shares a key, the rest is tolerated */
takeWeak({a: 1, ...unknownBag}); /* ok: written key is common, spread is tolerated */
let tick = 0;
const nextKey = () => tick++;
takeFresh({x: 1, ...{[nextKey()]: 2}}); /* ok: impure keys are tolerated, never double-run */
takeFresh({x: 1, [nextKey()]: 3}); /* ok: impure computed names are not statically written */
class FreshBox {
  /** @param {{x: number}} o */
  constructor(o) {
    this.o = o;
  }
}
/* @ts-expect-error: new-expression args are fresh too */
const made = new FreshBox({x: 1, extra: 9});
function flag() {
  return true;
}
/* @ts-expect-error: sequence tails are fresh at the call site */
takeFresh((flag(), {x: 1, extra: 10}));
/* @ts-expect-error: parenthesized literals stay fresh */
takeFresh(({x: 1, extra: 11}));
/**
 * @param {{[key: string]: number}} m
 */
function takeMap(m) {
  return m;
}
takeMap({x: 1}); /* ok: values match the index signature */
const strBag = {y: 's'};
/* @ts-expect-error: index value mismatch still throws through a spread */
takeMap({x: 1, ...strBag});
/**
 * @param {{a: number} | {b: string}} u
 */
function takeUnion(u) {
  return u;
}
takeUnion({a: 1}); /* ok: one member matches */
const mixBag = {b: 's', zzz: 9};
takeUnion({a: 1, ...mixBag}); /* ok: spread keys never count as excess per member */
