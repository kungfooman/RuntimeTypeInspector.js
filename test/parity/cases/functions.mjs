/**
 * Function-typed parameters: tsc checks arity, RTI only checks callability.
 * @param {(text: string) => void} f - A callback.
 * @returns {void}
 */
function checkCallback(f) {
}
checkCallback((text) => {});
checkCallback(1);
checkCallback(function twoArgs(/** @type {string} */ a, /** @type {string} */ b) {}); // parity-diverges: rti-quieter (arity unchecked)
