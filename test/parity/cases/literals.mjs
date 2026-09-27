/**
 * Literal and primitive parity: tsc is the oracle, RTI must agree per case.
 * @param {string} x - A string.
 * @returns {void}
 */
function case01(x) {
}
/**
 * @param {number} n - A number.
 * @returns {void}
 */
function case02(n) {
}
/**
 * @param {boolean} b - A boolean.
 * @returns {void}
 */
function case03(b) {
}
/**
 * @param {"a"} lit - A string literal.
 * @returns {void}
 */
function case04(lit) {
}
/**
 * @param {1} one - The literal 1.
 * @returns {void}
 */
function case05(one) {
}
case01(1);
case01("a");
case02("x");
case02(2);
case03(1);
case03(true);
case04("b");
case04("a");
case05(2);
case05(1);
