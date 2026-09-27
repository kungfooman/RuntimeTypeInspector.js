/**
 * Arrays, tuples, and special number values.
 * @param {Array<number>} xs - Numbers.
 * @returns {void}
 */
function case01(xs) {
}
/**
 * @param {[number, string]} pair - A pair.
 * @returns {void}
 */
function case02(pair) {
}
/**
 * @param {number} n - A finite-or-not number.
 * @returns {void}
 */
function case03(n) {
}
case01([1, 2]);
case01([1, "x"]);
case02([1, "a"]);
case02([1]);
case02([1, "a", true]);
case03(NaN); // parity-diverges: rti-stricter (NaN always rejected)
case03(Infinity);
case03(1);
