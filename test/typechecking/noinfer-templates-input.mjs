/**
 * `NoInfer<K>` blocks inference from its position AND keeps the literal:
 * with `@template {string} K`, `K` fixes to the literal from `name`.
 * (Needs TypeScript 5.4+ for `tsc`; RTI implements `NoInfer` itself.)
 *
 * @template {string} K
 * @param {K} name - Pins the literal `K` (e.g. `'a'`).
 * @param {{sub: NoInfer<K>}} opts - Checked against `K`, never infers it.
 * @returns {K} The sub value.
 */
function h(name, opts) {
  return opts.sub;
}
h('a', {sub: 'a'}); // ok
h('a', {sub: 'b'}); // warns: NoInfer blocks widening, K stays 'a'
h('a', {sub: 1}); // warns: 1 is not a string
/**
 * Without `NoInfer`, the nested occurrence widens the pin instead:
 * unconstrained `K` becomes `string`, so both calls below pass.
 *
 * @template K
 * @param {K} name - Pins the literal `K` (e.g. `'a'`).
 * @param {{sub: K}} opts - Contributes candidates, widens `K` to string.
 * @returns {K} The sub value.
 */
function f(name, opts) {
  return opts.sub;
}
f('a', {sub: 'b'}); // ok: K widens to string
f('a', {sub: 'a'}); // ok
/**
 * Bare `NoInfer<T>` never contributes: `T` stays its constraint for the
 * whole call, so every argument is checked against the constraint itself.
 *
 * @template T
 * @param {NoInfer<T>} a
 * @param {NoInfer<T>} b
 */
function takeBlocked(a, b) {
  return a;
}
takeBlocked('x', 1); // ok: T stays any, both satisfy it
/**
 * @template {string} T
 * @param {NoInfer<T>} a
 * @param {NoInfer<T>} b
 */
function takeBlockedString(a, b) {
  return a;
}
takeBlockedString('x', 'y'); // ok: both satisfy string
takeBlockedString('x', 1); // warns: 1 is not a string, T never widens
