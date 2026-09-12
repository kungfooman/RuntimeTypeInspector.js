
/**
 * @param {number} a - First number.
 * @param {number} b - Second number.
 * @returns {number} Sum of both numbers.
 */
const add = function (a, b) {
  if (!inspectType(a, "number", 'add', 'a')) {
    youCanAddABreakpointHere();
  }
  if (!inspectType(b, "number", 'add', 'b')) {
    youCanAddABreakpointHere();
  }
  return a + b;
};

/**
 * @param {string} name - The name.
 * @returns {Object} An object.
 */

var makeObj = function (name) {
  if (!inspectType(name, "string", 'makeObj', 'name')) {
    youCanAddABreakpointHere();
  }
  return {
    name
  };
};
