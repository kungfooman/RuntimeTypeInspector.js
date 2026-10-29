/**
 * Unparseable inner types: every `?`-shaped hole tsc reads leniently.
 * tsc treats JSDoc `?` as `any`, so the oracle accepts where the shape
 * allows and rejects where it does not; RTI must do the same.
 * @param {Array<?>} x - Unknown element.
 * @returns {void}
 */
function checkUnknownArray(x) {
}
/**
 * @param {Promise<?>} x - Unknown fulfillment.
 * @returns {void}
 */
function checkUnknownPromise(x) {
}
/**
 * @param {Set<?>} x - Unknown member.
 * @returns {void}
 */
function checkUnknownSet(x) {
}
/**
 * @param {Map<?, number>} x - Unknown key.
 * @returns {void}
 */
function checkUnknownKeyMap(x) {
}
/**
 * @param {Record<?, number>} x - Unknown record key.
 * @returns {void}
 */
function checkUnknownRecord(x) {
}
/**
 * @param {Array<string | ?>} x - Unknown union member.
 * @returns {void}
 */
function checkStringOrUnknownArray(x) {
}
/**
 * @param {string | ?} x - Top-level unknown member.
 * @returns {void}
 */
function checkStringOrUnknown(x) {
}
/**
 * @param {?} x - Bare unknown.
 * @returns {void}
 */
function checkUnknown(x) {
}
/**
 * @param {[string, number?]} x - Unnamed optional tuple element.
 * @returns {void}
 */
function checkLoosePair(x) {
}
checkUnknownArray([1]);
checkUnknownArray("a");
checkUnknownPromise(1);
checkUnknownSet(new Set([1]));
checkUnknownSet(1);
checkUnknownKeyMap(new Map([["a", 1]]));
checkUnknownKeyMap("x");
checkUnknownRecord({a: 1});
checkUnknownRecord("x");
checkStringOrUnknownArray(["a"]);
checkStringOrUnknownArray([1]);
checkStringOrUnknown("a");
checkStringOrUnknown(null);
checkUnknown(1);
checkUnknown("a");
checkLoosePair(["a", 1]);
checkLoosePair(["a"]);
checkLoosePair("a");
