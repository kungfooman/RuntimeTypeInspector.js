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
  return o;
}
takePartial({}); // Expected: no issue — all props optional
takePartial({a: 1}); // Expected: no issue
takePartial({a: 'x'}); // Expected: error — 'a' must be a number
/**
 * @param {Partial<Partial<Box>>} o
 */
function takeDeep(o) {
  return o;
}
takeDeep({}); // Expected: no issue
takeDeep({a: 1}); // Expected: no issue
takeDeep({a: 'x'}); // Expected: error — 'a' must be a number
/**
 * @param {Required<Partial<Box>>} o
 */
function takeRequired(o) {
  return o;
}
takeRequired({a: 1, b: 's'}); // Expected: no issue
takeRequired({}); // Expected: error — 'a' and 'b' are required
/**
 * @param {Omit<Partial<Box>, 'a'>} o
 */
function takeOmit(o) {
  return o;
}
takeOmit({b: 's'}); // Expected: no issue
takeOmit({a: 1}); // Expected: error — 'a' was omitted
takeOmit({b: 1}); // Expected: error — 'b' must be a string
/**
 * @param {Required<Partial<Box|Box2>>} o
 */
function takeRequiredUnion(o) {
  return o;
}
takeRequiredUnion({a: 1, b: 's'}); // Expected: no issue
takeRequiredUnion({a: 1, c: true}); // Expected: no issue
takeRequiredUnion({}); // Expected: error — 'a' is required
/**
 * @template T
 * @typedef {Partial<Pick<T, Extract<"a"|"b", keyof T>>>} OptA
 */
/**
 * @param {OptA<Box>} o
 */
function takeGeneric(o) {
  return o;
}
takeGeneric({a: 1}); // Expected: no issue
takeGeneric({b: 's'}); // Expected: no issue
takeGeneric({c: 1}); // Expected: error — 'c' is unknown
takeGeneric({a: 'x'}); // Expected: error — 'a' must be a number
