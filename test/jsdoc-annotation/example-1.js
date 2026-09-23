/**
 * @param {10000} a
 * @param {object} options
 * @param {1000} options.b
 * @param {100[]} arrayTest
 * @param {[10, 1]} tupleTest
 */
function add(a, {b}, [c], [d, e]) {
  return a + b + c + d + e;
}
add(10000, {b: 1000}, [100], [10, 1]); // 11111
/*
{
  "a": 10000,
  "b": 1000,
  "c": 100,
  "d": 10,
  "e": 1
}
*/
