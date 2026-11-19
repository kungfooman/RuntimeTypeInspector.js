/**
 * Bare `{array}` is the `any[]` hole from issue #328: lowercase `array`
 * names no element type (cannon.js `ConvexPolyhedron` documents
 * `@param {array} points`), and the old `validateArray` recursed into
 * the missing `elementType`, crashing with `Cannot read properties of
 * undefined (reading '0')` instead of validating. Lowercase `{array}`
 * is not valid TypeScript (tsc reports `Cannot find name 'array'`), so
 * the `@ts-expect-error` tsc self-check convention does not apply here;
 * the contracts are runtime-only: every `// ok` call must pass, every
 * `// warns` call must throw, and `*-errors.json` pins the sequence.
 * Bare `{Array}` (capital, no type argument) IS valid TS and means
 * `any[]`, but every bare-`array` declaration already errors under tsc
 * (`Cannot find name 'array'`, `Array<T> requires 1 type argument`), so
 * no call line can carry a consuming `@ts-expect-error`: the contracts
 * below are runtime-only (`*-errors.json` pins the throw sequence).
 */
/**
 * @param {array} a - Bare lowercase: any array passes, never crashes.
 * @returns {*} The value.
 */
function bare(a) {
  return a;
}
/**
 * @param {Array} a - Bare capital: tsc reads it as `any[]`.
 * @returns {*} The value.
 */
function bareCapital(a) {
  return a;
}
/**
 * @param {array|number} a - Bare member inside a union.
 * @returns {*} The value.
 */
function bareUnion(a) {
  return a;
}
/**
 * @param {Array<array>} a - Bare member as a nested element type.
 * @returns {*} The value.
 */
function bareNested(a) {
  return a;
}
/**
 * @param {[array, number]} a - Bare member as a tuple element.
 * @returns {*} The value.
 */
function bareTuple(a) {
  return a;
}
bare([10, 20]); // ok: dense arrays pass
bare([]); // ok: empty passes
bare([1, 'x', {}]); // ok: any contents pass, no element check
bareCapital([10, 20]); // ok
bareUnion([1]); // ok: array member matches
bareUnion(5); // ok: number member matches
bareNested([[1], ['x']]); // ok: each inner array passes the bare check
bareTuple([[1], 2]); // ok
bareCapital(123); // warns: not an array
bareUnion('nope'); // warns: neither array nor number
bareNested([[1], 42]); // warns: 42 is not an array
bareTuple([[1], 'nope']); // warns: second element is not a number
bare(123); // warns: not an array
