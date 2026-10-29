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
function checkComponentName(name) {
}
/**
 * @param {ComponentMap["camera"]} options - Camera options.
 * @returns {void}
 */
function checkCameraOptions(options) {
}
/**
 * @param {ComponentMap["camera"] & {fov: number}} options - Intersection.
 * @returns {void}
 */
function checkCameraIntersection(options) {
}
checkComponentName("camera");
checkComponentName("nope");
checkCameraOptions({fov: 60});
checkCameraOptions({fov: "60"});
checkCameraIntersection({fov: 60});
checkCameraIntersection({});
