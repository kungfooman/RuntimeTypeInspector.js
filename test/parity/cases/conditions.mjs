/**
 * Conditional types over literals: every decidable branch must agree.
 * @param {"a" extends string ? number : boolean} x - True branch.
 * @returns {void}
 */
function checkExtendsStringTrue(x) {
}
/**
 * @param {"a" extends number ? number : boolean} x - False branch.
 * @returns {void}
 */
function checkExtendsStringFalse(x) {
}
/**
 * Boolean literal checks (regression: `false extends true` failed closed).
 * @param {false extends true ? number : string} x - False branch.
 * @returns {void}
 */
function checkFalseExtendsTrue(x) {
}
/**
 * @param {true extends true ? number : string} x - True branch.
 * @returns {void}
 */
function checkTrueExtendsTrue(x) {
}
/**
 * Number literal checks.
 * @param {1 extends 2 ? number : string} x - False branch.
 * @returns {void}
 */
function checkOneExtendsTwo(x) {
}
/**
 * @param {1 extends number ? number : string} x - True branch.
 * @returns {void}
 */
function checkOneExtendsNumber(x) {
}
checkExtendsStringTrue(1);
checkExtendsStringTrue("a");
checkExtendsStringFalse(true);
checkExtendsStringFalse(1);
checkFalseExtendsTrue("a");
checkFalseExtendsTrue(1);
checkTrueExtendsTrue(1);
checkTrueExtendsTrue("a");
checkOneExtendsTwo("a");
checkOneExtendsTwo(1);
checkOneExtendsNumber(1);
checkOneExtendsNumber("a");
