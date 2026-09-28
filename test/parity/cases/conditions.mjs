/**
 * Conditional types over literals: every decidable branch must agree.
 * @param {"a" extends string ? number : boolean} x - True branch.
 * @returns {void}
 */
function case01(x) {
}
/**
 * @param {"a" extends number ? number : boolean} x - False branch.
 * @returns {void}
 */
function case02(x) {
}
/**
 * Boolean literal checks (regression: `false extends true` failed closed).
 * @param {false extends true ? number : string} x - False branch.
 * @returns {void}
 */
function case03(x) {
}
/**
 * @param {true extends true ? number : string} x - True branch.
 * @returns {void}
 */
function case04(x) {
}
/**
 * Number literal checks.
 * @param {1 extends 2 ? number : string} x - False branch.
 * @returns {void}
 */
function case05(x) {
}
/**
 * @param {1 extends number ? number : string} x - True branch.
 * @returns {void}
 */
function case06(x) {
}
case01(1);
case01("a");
case02(true);
case02(1);
case03("a");
case03(1);
case04(1);
case04("a");
case05("a");
case05(1);
case06(1);
case06("a");
