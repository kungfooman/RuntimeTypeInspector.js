/**
 * Unions and nullability under --strict on both sides.
 * @param {string | number} x - Union.
 * @returns {void}
 */
function checkStringOrNumber(x) {
}
/**
 * @param {?string} x - Nullable shorthand.
 * @returns {void}
 */
function checkNullableString(x) {
}
/**
 * @param {string} x - Non-nullable.
 * @returns {void}
 */
function checkPlainString(x) {
}
/**
 * @param {string | undefined} x - Explicit undefined member.
 * @returns {void}
 */
function checkStringOrUndefined(x) {
}
/**
 * @param {string} [x] - Optional parameter.
 * @returns {void}
 */
function checkOptionalString(x) {
}
checkStringOrNumber(true);
checkStringOrNumber(1);
checkStringOrNumber("a");
checkNullableString(null);
checkNullableString("a");
checkNullableString(undefined);
checkPlainString(null);
checkPlainString(undefined);
checkPlainString("a");
checkStringOrUndefined(undefined);
checkStringOrUndefined(null);
checkOptionalString();
checkOptionalString(1);
checkOptionalString("a");
