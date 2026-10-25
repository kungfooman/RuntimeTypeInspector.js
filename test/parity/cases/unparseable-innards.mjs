/**
 * Unparseable inner types: every `?`-shaped hole tsc reads leniently.
 * tsc treats JSDoc `?` as `any`, so the oracle accepts where the shape
 * allows and rejects where it does not; RTI must do the same.
 * @param {Array<?>} x - Unknown element.
 * @returns {void}
 */
function case01(x) {
}
/**
 * @param {Promise<?>} x - Unknown fulfillment.
 * @returns {void}
 */
function case02(x) {
}
/**
 * @param {Set<?>} x - Unknown member.
 * @returns {void}
 */
function case03(x) {
}
/**
 * @param {Map<?, number>} x - Unknown key.
 * @returns {void}
 */
function case04(x) {
}
/**
 * @param {Record<?, number>} x - Unknown record key.
 * @returns {void}
 */
function case05(x) {
}
/**
 * @param {Array<string | ?>} x - Unknown union member.
 * @returns {void}
 */
function case06(x) {
}
/**
 * @param {string | ?} x - Top-level unknown member.
 * @returns {void}
 */
function case07(x) {
}
/**
 * @param {?} x - Bare unknown.
 * @returns {void}
 */
function case08(x) {
}
/**
 * @param {[string, number?]} x - Unnamed optional tuple element.
 * @returns {void}
 */
function case09(x) {
}
case01([1]);
case01("a");
case02(1);
case03(new Set([1]));
case03(1);
case04(new Map([["a", 1]]));
case04("x");
case05({a: 1});
case05("x");
case06(["a"]);
case06([1]);
case07("a");
case07(null);
case08(1);
case08("a");
case09(["a", 1]);
case09(["a"]);
case09("a");
