/**
 * @param {Map<string, number>} numbers - Map of numbers.
 */
function test(numbers) {
  // nothing
}
const a = new Date();
const b = Date.now();
const map = new Map([
  ['1st', a],
  ['2nd', b],
]);
test([1, 2, 3, "4"]);
test(map);
