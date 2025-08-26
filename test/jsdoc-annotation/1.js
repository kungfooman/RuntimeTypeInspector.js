/**
  @TODO Separate into individual tests

  Function nodes should contain these properties in "functionNode.jsdoc":

        // 1st example
        "paramTypes": {
          "a": "10000",
          "b": "1000",
          "c": "100",
          "d": "10",
          "e": "1"
        }

        // 2nd example
        "paramTypes": {
          "a": "'a'",
          "b": "'b'",
          "c": "'c'",
          "d": "'d'",
          "e": "'e'"
        }

        // 3rd example
        "paramTypes": {
          "a": "'a'",
          "b": "'b'",
          "c": "'c'",
          "e": "'e'"
        }
*/

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
