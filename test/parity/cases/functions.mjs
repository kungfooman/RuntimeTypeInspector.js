/**
 * Function-typed parameters: tsc checks arity, RTI only checks callability.
 * @param {(text: string) => void} f - A callback.
 * @returns {void}
 */
function case01(f) {
}
/**
 * @param {string} a - First.
 * @param {string} b - Second.
 * @returns {void}
 */
function twoArgs(a, b) {
}
case01((text) => {});
case01(1);
case01(twoArgs); // parity-diverges: rti-quieter (arity unchecked)
