/**
 * Arrays, tuples, and special number values.
 * @param {Array<number>} xs - Numbers.
 * @returns {void}
 */
function checkNumberArray(xs) {
}
/**
 * @param {[number, string]} pair - A pair.
 * @returns {void}
 */
function checkPair(pair) {
}
/**
 * @param {number} n - A finite-or-not number.
 * @returns {void}
 */
function checkNumber(n) {
}
checkNumberArray([1, 2]);
checkNumberArray([1, "x"]);
checkPair([1, "a"]);
checkPair([1]);
checkPair([1, "a", true]);
checkNumber(NaN); // parity-diverges: rti-stricter (NaN always rejected)
checkNumber(Infinity);
checkNumber(1);
