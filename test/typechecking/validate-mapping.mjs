/**
 * @typedef {1|2|3} Iterable1
 * @typedef {{a: 'aa', b: 'bb', c: 'cc'}} TestObject
 * @typedef {keyof TestObject} Iterable2
 * @typedef {TestObject[keyof TestObject]} Iterable3
 * @typedef {{[Key in Iterable1]: {testkey: Key}}} Test1
 * @typedef {{[Key in Iterable2]: {testkey: Key}}} Test2
 * @typedef {{[Key in Iterable3]: {testkey: Key}}} Test3
 * @typedef {{[Key in 1|2|3]: {testkey: Key}}} Test4
 */
/**
 * @param {Test1} x - First argument.
 * @returns {Test1} - Return value.
 */
function identity1(x) {
  return x;
}
/**
 * @param {Test2} x - First argument.
 * @returns {Test2} - Return value.
 */
function identity2(x) {
  return x;
}
/**
 * @param {Test3} x - First argument.
 * @returns {Test3} - Return value.
 */
function identity3(x) {
  return x;
}
/**
 * @param {Test4} x - First argument.
 * @returns {Test4} - Return value.
 */
function identity4(x) {
  return x;
}
identity1({
  1: {testkey: 1},
  2: {testkey: 2},
  3: {testkey: 3},
});
identity2({
  a: {testkey: 'a'},
  b: {testkey: 'b'},
  c: {testkey: 'c'},
});
identity3({
  aa: {testkey: 'aa'},
  bb: {testkey: 'bb'},
  cc: {testkey: 'cc'},
});
identity4({
  1: {testkey: 1},
  2: {testkey: 2},
  3: {testkey: 3},
});
