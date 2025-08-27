/**
 * @param {'a'} a
 * @param {object} options
 * @param {'b'} options.b
 * @param {'c'[]} arrayTest
 * @param {[undefined, 'e']} tupleTest
 */
function addStrSkipD(a, {b}, [c], [, e]) {
  return a + b + c + e;
}
addStrSkipD('a', {b: 'b'}, ['c'], [, 'e']); // 'abce'
/*
{
  "a": "'a'",
  "b": "'b'",
  "c": "'c'",
  "e": "'e'"
}
*/
