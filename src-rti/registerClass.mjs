/**
 * @type {Record<string, object>}
 */
const classes = {};
/**
 * @param {object} theClass - The class.
 */
function registerClass(theClass) {
  classes[theClass.name] = theClass;
}
export {classes, registerClass};
