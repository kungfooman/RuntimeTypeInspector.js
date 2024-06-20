/**
 * @param {number[]} arr - The number array.
 * @returns {number[]} The return value.
 */
function test([a, b, ...rest] = [1, 2, 3]) {
  if (!inspectType(a, "number", 'test', 'arr')) {
    youCanAddABreakpointHere();
  }
  if (!inspectType(b, "number", 'test', 'arr')) {
    youCanAddABreakpointHere();
  }
  return rest;
}
const ret = test([10, 20]);
console.log('ret', ret); // Quiz for you!
