/**
 * Unions and nullability under --strict on both sides.
 * @param {string | number} x - Union.
 * @returns {void}
 */
function case01(x) {
}
/**
 * @param {?string} x - Nullable shorthand.
 * @returns {void}
 */
function case02(x) {
}
/**
 * @param {string} x - Non-nullable.
 * @returns {void}
 */
function case03(x) {
}
/**
 * @param {string | undefined} x - Explicit undefined member.
 * @returns {void}
 */
function case04(x) {
}
/**
 * @param {string} [x] - Optional parameter.
 * @returns {void}
 */
function case05(x) {
}
case01(true);
case01(1);
case01("a");
case02(null);
case02("a");
case02(undefined);
case03(null);
case03(undefined);
case03("a");
case04(undefined);
case04(null);
case05();
case05(1);
case05("a");
