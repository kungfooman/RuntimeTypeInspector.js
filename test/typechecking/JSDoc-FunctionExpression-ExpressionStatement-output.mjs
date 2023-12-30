let add;
/**
 * @param {number} a - First number.
 * @param {number} b - Second number.
 * @returns {number} - Sum of both numbers.
 */
add = function (a, b) {
  if (!inspectType(a, "number", 'add', 'a')) {
    youCanAddABreakpointHere();
  }
  if (!inspectType(b, "number", 'add', 'b')) {
    youCanAddABreakpointHere();
  }
  return a + b;
};
add =
  /**
   * @param {number} a - First number.
   * @param {number} b - Second number.
   * @returns {number} - Sum of both numbers.
   */
  function (a, b) {
    if (!inspectType(a, "number", 'add', 'a')) {
      youCanAddABreakpointHere();
    }
    if (!inspectType(b, "number", 'add', 'b')) {
      youCanAddABreakpointHere();
    }
    return a + b;
  };
/**
 * @param {number} a - Left hand side value.
 * @returns {Function} - Function accepted second number.
 */
function add2(a) {
  if (!inspectType(a, "number", 'add2', 'a')) {
    youCanAddABreakpointHere();
  }
  return (
    /**
     * @param {number} b - Value.
     * @returns {number} Sum of a and b.
     */
    function (b) {
      if (!inspectType(b, "number", 'unnamed function expression', 'b')) {
        youCanAddABreakpointHere();
      }
      return a + b;
    }
  );
}
