/**
 * Rest-spelling parity: the overload tuple marks `...T[]` variadic, keeps
 * `...T` variadic over the gathered element, rejects optional rest
 * (`TS2370`) with `never`, and drops the TS1003/TS8032 `{T[]} ...name`
 * misspelling. Each block below states the tsc verdict inline; the
 * sibling errors file pins which calls must throw at runtime.
 */

/**
 * @overload
 * @param {string} label
 * @param {...number[]} values
 * @returns {number}
 */
/**
 * @param {string} label
 * @param {...number[]} values
 * @returns {number}
 */
function documented(label, ...values) {
  return values.length;
}
documented('x'); // ok
documented('x', 1, 2); // ok
documented('x', 1, 'bad'); // warns: rest elements must be numbers.

/**
 * @overload
 * @param {string} label
 * @param {...number} values
 * @returns {number}
 */
/**
 * @param {string} label
 * @param {...number} values
 * @returns {number}
 */
function bare(label, ...values) {
  return values.length;
}
// tsc rejects the gathered shape ([number] vs number), so no ok call here:
// the marker gathers the values into one element checked against number.
bare('x', [1, 2]); // warns: gathered array against number.

/**
 * @overload
 * @param {...number[]} [values]
 * @returns {number}
 */
/**
 * @param {number[]} values
 * @returns {number}
 */
function optionalRest(values) {
  return 0;
}
// tsc TS2370: optional rest matches no call shape, so every call warns.
optionalRest(); // ok: empty call still satisfies the optional member.
optionalRest([1, 2]); // warns

/**
 * @overload
 * @param {number[]} ...values
 * @returns {number}
 */
/**
 * @param {number[]} values
 * @returns {number}
 */
function misplaced(values) {
  return 0;
}
// tsc TS1003: identifier expected at `...values`; the overload drops it.
misplaced(1); // warns: misspelled overload matches no call.
misplaced([1]); // warns: misspelled overload matches no call.
