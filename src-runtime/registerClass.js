/** @type {Record<string, Function>} */
const classes = {};
/**
 * Mutation counter for the class registry (see `typedefVersion`): lets
 * resolution caches invalidate on re-registration with one compare.
 * @type {number}
 */
let classVersion = 0;
/**
 * @param {Function} theClass - The class.
 */
function registerClass(theClass) {
  classes[theClass.name] = theClass;
  classVersion++;
}
/**
 * Bumps the version for out-of-band registry mutations (test resets that
 * delete keys directly instead of registering).
 */
function bumpClassVersion() {
  classVersion++;
}
export {classes, registerClass, classVersion, bumpClassVersion};
