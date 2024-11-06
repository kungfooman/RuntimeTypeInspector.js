/**
 * @param {function (number, number): number} cb
 */
function op(cb, a, b) {
  return cb(a, b);
}
const ret = op((a, b) => a + b, 10, 20);
console.log("ret", ret);
