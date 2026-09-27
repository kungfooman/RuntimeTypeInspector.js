/**
 * Keyof, indexed access, and intersections over local typedefs.
 * @typedef {object} ComponentMap
 * @property {{fov: number}} camera - Camera shape.
 * @property {{intensity: number}} light - Light shape.
 *
 * @typedef {keyof ComponentMap & string} ComponentName
 *
 * @param {ComponentName} name - A component name.
 * @returns {void}
 */
function case01(name) {
}
/**
 * @param {ComponentMap["camera"]} options - Camera options.
 * @returns {void}
 */
function case02(options) {
}
/**
 * @param {ComponentMap["camera"] & {fov: number}} options - Intersection.
 * @returns {void}
 */
function case03(options) {
}
case01("camera");
case01("nope");
case02({fov: 60});
case02({fov: "60"});
case03({fov: 60});
case03({});
