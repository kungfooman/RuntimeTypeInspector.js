/**
 * Literal and primitive parity: tsc is the oracle, RTI must agree per case.
 * @param {string} x - A string.
 * @returns {void}
 */
function checkString(x) {
}
/**
 * @param {number} n - A number.
 * @returns {void}
 */
function checkNumber(n) {
}
/**
 * @param {boolean} b - A boolean.
 * @returns {void}
 */
function checkBoolean(b) {
}
/**
 * @param {"a"} lit - A string literal.
 * @returns {void}
 */
function checkStringLiteral(lit) {
}
/**
 * @param {1} one - The literal 1.
 * @returns {void}
 */
function checkOne(one) {
}
checkString(1);
checkString("a");
checkNumber("x");
checkNumber(2);
checkBoolean(1);
checkBoolean(true);
checkStringLiteral("b");
checkStringLiteral("a");
checkOne(2);
checkOne(1);
