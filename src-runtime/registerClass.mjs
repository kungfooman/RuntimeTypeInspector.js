/**
 * @type {Record<string, Function>}
 */
const classes = {};
/**
 * @param {Function} theClass - The class.
 */
function registerClass(theClass) {
  classes[theClass.name] = theClass;
}
export {classes, registerClass};
