function add(/** @type {number} */ a, /** @type {number} */ b) {
  if (!inspectType(a, "number", 'add', 'a')) {
    youCanAddABreakpointHere();
  }
  if (!inspectType(b, "number", 'add', 'b')) {
    youCanAddABreakpointHere();
  }
  return a + b;
}

/**
 * @param {string} a - Keeps JSDoc, inline ignored.
 */

function keep(a, /** @type {number} */ b = 1) {
  if (!inspectType(a, "string", 'keep', 'a')) {
    youCanAddABreakpointHere();
  }
  if (!inspectType(b, {
    "type": "number",
    "optional": true
  }, 'keep', 'b')) {
    youCanAddABreakpointHere();
  }
  return [a, b];
}
