/**
 * @param {'a'} a
 * @param {object} options
 * @param {'b'} options.b
 * @param {'c'[]} arrayTest
 * @param {['d', 'e']} tupleTest
 */
function addStr(a, {b}, [c], [d, e]) {
  return a + b + c + d + e;
}
addStr('a', {b: 'b'}, ['c'], ['d', 'e']); // 'abcde'
/*
{
  "a": "'a'",
  "b": "'b'",
  "c": "'c'",
  "d": "'d'",
  "e": "'e'"
}
*/
