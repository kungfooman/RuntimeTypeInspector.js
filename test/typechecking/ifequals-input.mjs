/**
 * Resolves to `A` when the types `X` and `Y` are identical, otherwise to `B`.
 *
 * @template X
 * @template Y
 * @template [A=X]
 * @template [B=never]
 * @typedef {(<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? A : B} IfEquals
 */
/**
 * Identical primitives take the `A` branch.
 *
 * @param {IfEquals<string, string, 'yes', 'no'>} result
 */
function takeYes(result) {
  return result;
}
takeYes('yes'); // ok
takeYes('no'); // warns: A branch wants 'yes'
takeYes(1); // warns: A branch wants 'yes'
/**
 * Different primitives take the `B` branch.
 *
 * @param {IfEquals<string, number, 'yes', 'no'>} result
 */
function takeNo(result) {
  return result;
}
takeNo('no'); // ok
takeNo('yes'); // warns: B branch wants 'no'
takeNo(1); // warns: B branch wants 'no'
/**
 * Missing `A`/`B` fall back to the TypeScript defaults (`A=X`, `B=never`).
 *
 * @param {IfEquals<string, string>} a
 */
function takeDefaultA(a) {
  return a;
}
takeDefaultA('anything'); // ok
takeDefaultA(1); // warns: A defaults to string
/**
 * @param {IfEquals<string, number>} n
 */
function takeNever(n) {
  return n;
}
takeNever('x'); // warns: B defaults to never
takeNever(1); // warns: B defaults to never
/**
 * Structural identity decides object comparisons.
 *
 * @param {IfEquals<{a: number}, {a: number}, 'yes', 'no'>} result
 */
function takeSameShape(result) {
  return result;
}
takeSameShape('yes'); // ok
takeSameShape('no'); // warns: identical shapes take A
/**
 * @param {IfEquals<{a: number}, {b: number}, 'yes', 'no'>} result
 */
function takeDiffShape(result) {
  return result;
}
takeDiffShape('no'); // ok
takeDiffShape('yes'); // warns: different shapes take B
/**
 * Fewer than two type arguments is malformed and always warns.
 *
 * @param {IfEquals<string>} broken
 */
function takeBroken(broken) {
  return broken;
}
takeBroken('x'); // warns: IfEquals needs two type arguments
