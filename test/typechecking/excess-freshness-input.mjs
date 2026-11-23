/**
 * Excess Property Checking on fresh literals plus the weak-type gate:
 * fresh object literals reject unknown keys while the same shape in a
 * stale variable passes structurally (`tsc --strict` parity, verified on
 * the `CC-*` mirrors). A stale probe with no key in common with an
 * all-optional shape still fails (`tsc` TS2559). Every throwing call
 * carries `@ts-expect-error`, so a tsc-strict run is green if and only
 * if each directive is consumed and nothing else errors.
 */
/**
 * @param {{r: number, g: number, b: number}} color
 */
function takeColor(color) {
  return color;
}
takeColor({r: 1, g: 2, b: 3}); /* ok: exact fresh literal */
/* @ts-expect-error: fresh excess key */
takeColor({r: 1, g: 2, b: 3, a: 4});
const staleColor = {r: 1, g: 2, b: 3, a: 4};
takeColor(staleColor); /* ok: stale excess passes structurally */
/**
 * @param {{nested: {x: number}}} o
 */
function takeNested(o) {
  return o;
}
/* @ts-expect-error: nested fresh excess key */
takeNested({nested: {x: 1, extra: 2}});
const inner = {x: 1, extra: 2};
takeNested({nested: inner}); /* ok: nested stale passes */
/**
 * @typedef {{a: number, b: string}} CCBox
 * @typedef {Partial<CCBox>} CCPartial
 * @typedef {Partial<Pick<CCBox, "a">>} CCPick
 * @typedef {Partial<Omit<CCBox, "a">>} CCOmit
 */
/** @param {CCPartial} x */
function takePartial(x) {
  return x;
}
takePartial({a: 1}); /* ok: overlapping stale passes */
takePartial({}); /* ok: empty is assignable to every weak shape */
/* @ts-expect-error: fresh excess key */
takePartial({a: 1, zzz: 9});
const staleUnknown = {zzz: 9};
takePartial(staleUnknown); /* ok: unknown excess is not a weak-type fail */
/** @param {CCPick} x */
function takePick(x) {
  return x;
}
takePick({}); /* ok */
/* @ts-expect-error: fresh picked-away key */
takePick({b: 's'});
const stalePickedAway = {b: 's'};
takePick(stalePickedAway); /* throws: no key in common (tsc TS2559) */
/** @param {CCOmit} x */
function takeOmit(x) {
  return x;
}
takeOmit({b: 's'}); /* ok: surviving key */
/* @ts-expect-error: fresh omitted key */
takeOmit({a: 1});
const staleOmitted = {a: 1};
takeOmit(staleOmitted); /* throws: no key in common (tsc TS2559) */
