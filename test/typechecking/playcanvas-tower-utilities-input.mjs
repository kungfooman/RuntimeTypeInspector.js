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
takePartial({});
takePartial({a: 1});
takePartial({a: 'x'});
/**
 * @param {Partial<Partial<Box>>} o
 */
function takeDeep(o) {
  return o;
}
takeDeep({});
takeDeep({a: 1});
takeDeep({a: 'x'});
/**
 * @param {Required<Partial<Box>>} o
 */
function takeRequired(o) {
  return o;
}
takeRequired({a: 1, b: 's'});
takeRequired({});
/**
 * @param {Omit<Partial<Box|Box2>, 'a'>} o
 */
function takeOmitUnion(o) {
  return o;
}
takeOmitUnion({b: 's'});
takeOmitUnion({c: true});
takeOmitUnion({a: 1});
takeOmitUnion({b: 1});
/**
 * @template T
 * @typedef {Partial<Pick<T, "a">>} OptA
 */
/**
 * @param {OptA<Box>} o
 */
function takeGeneric(o) {
  return o;
}
takeGeneric({a: 1});
takeGeneric({});
takeGeneric({a: 'x'});
