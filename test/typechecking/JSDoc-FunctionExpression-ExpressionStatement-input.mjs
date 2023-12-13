let add;
/**
 * @param {number} a - First number.
 * @param {number} b - Second number.
 * @returns {number} - Sum of both numbers.
 */
add = function (a, b) {
  return a + b;
};
add =
  /**
   * @param {number} a - First number.
   * @param {number} b - Second number.
   * @returns {number} - Sum of both numbers.
   */
  function (a, b) {
    return a + b;
  };
/**
 * @param {number} a - Left hand side value.
 * @returns {Function} - Function accepted second number.
 */
function add2(a) {
  return (
    /**
     * @param {number} b - Value.
     * @returns {number} Sum of a and b.
     */
    function (b) {
      return a + b;
    }
  );
}
