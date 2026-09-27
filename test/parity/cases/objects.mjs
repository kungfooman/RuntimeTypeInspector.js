/**
 * Object shapes: missing, wrong-typed, nested, and excess keys (tsc checks
 * excess properties on literals, RTI does not: documented divergence).
 * @param {{fov: number}} options - Options.
 * @returns {void}
 */
function case01(options) {
}
/**
 * @param {{fov: number, clearColor: Array<number>}} options - Options.
 * @returns {void}
 */
function case02(options) {
}
/**
 * @param {{nested: {enabled: boolean}}} options - Nested options.
 * @returns {void}
 */
function case03(options) {
}
case01({});
case01({fov: 60});
case01({fov: "60"});
case02({fov: 60, clearColor: [0, 0, 0]});
case02({fov: 60});
case02({fov: 60, clearColor: "red"});
case01({fov: 60, extra: true}); // parity-diverges: rti-quieter (no excess-property check)
case03({nested: {enabled: 1}});
case03({nested: {enabled: true}});
