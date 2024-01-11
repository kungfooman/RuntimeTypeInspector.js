/**
 * @template {any} T
 * @typedef {{recTest: T}} RecursionTest
 */
/**
 * @typedef {{
 *  [x: string]: Foo|undefined
 * }} Foo
 */
/**
 * @typedef {T | CircularArray<T>} Circular
 * @template T
 */
/**
 * @typedef {Circular<T>[]} CircularArray
 * @template T
 */
/**
 * @typedef {1|2|3} Iterable1
 * @typedef {{a: 'aa', b: 'bb', c: 'cc'}} TestObject
 * @typedef {keyof TestObject} Iterable2
 * @typedef {TestObject[keyof TestObject]} Iterable3
 * @typedef {{[Key in Iterable1]: {testkey: Key}}} Test1
 * @typedef {{[Key in Iterable2]: {testkey: Key}}} Test2
 * @typedef {{[Key in Iterable3]: {testkey: Key}}} Test3
 * @typedef {{[Key in 1|2|3]: {testkey: Key}}} Test4
 * @typedef {keyof (1|2|3)} Test5
 * @typedef {keyof Iterable1} Test5_2
 * @typedef {keyof Test5} KeyOfTest5
 * @typedef {keyof ('a'|'b'|'c')} Test6
 * @typedef {keyof ('a'|'b'|'c')} Test7
 * @typedef {{[Key in Iterable3]: {a: Circular<Key>, testkey: Key, inner: {innerKey: Key, inner2: Circular<Key>}}}} Test8
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
