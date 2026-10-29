/**
 * Object shapes: missing, wrong-typed, nested, and excess keys (tsc checks
 * excess properties on literals, RTI does not: documented divergence).
 * @param {{fov: number}} options - Options.
 * @returns {void}
 */
function checkFovOptions(options) {
}
/**
 * @param {{fov: number, clearColor: Array<number>}} options - Options.
 * @returns {void}
 */
function checkFovColorOptions(options) {
}
/**
 * @param {{nested: {enabled: boolean}}} options - Nested options.
 * @returns {void}
 */
function checkNestedOptions(options) {
}
checkFovOptions({});
checkFovOptions({fov: 60});
checkFovOptions({fov: "60"});
checkFovColorOptions({fov: 60, clearColor: [0, 0, 0]});
checkFovColorOptions({fov: 60});
checkFovColorOptions({fov: 60, clearColor: "red"});
checkFovOptions({fov: 60, extra: true});
checkNestedOptions({nested: {enabled: 1}});
checkNestedOptions({nested: {enabled: true}});
