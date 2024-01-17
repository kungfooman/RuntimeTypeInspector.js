/**
 * @typedef {{a: 'aa', b: 'bb', c: 'cc'}} Obj
 * @typedef {{a: 'aa', d: 'dd'}} Obj2
 * @typedef {keyof Obj} Keys
 * @typedef {Obj[keyof Obj]} ObjKeys1
 * @typedef {Obj[Keys]} ObjKeys2
 * @typedef {Obj[keyof Obj2]} ObjKeys3 - Interesting, throwing error: Property 'd' does not exist on type 'Obj'.ts(2339)
 * @typedef {{[Key in ObjKeys1]: {testkey: Key}}} ObjTest1
 * @typedef {{[Key in ObjKeys2]: {testkey: Key}}} ObjTest2
 */
const t = createTypeFromMapping(typedefs.ObjTest2, console.log);
console.log(t);
/**
 * @param {ObjTest1} x - First argument.
 * @returns {ObjTest1} - Return value.
 */
function identity1(x) {
  return x;
}
identity1({
  aa: {testkey: 'aa'},
  bb: {testkey: 'bb'},
  cc: {testkey: 'cc'},
});
/**
 * @param {ObjTest2} x - First argument.
 * @returns {ObjTest2} - Return value.
 */
function identity2(x) {
  return x;
}
identity2({
  aa: {testkey: 'aa'},
  bb: {testkey: 'bb'},
  cc: {testkey: 'cc'},
});
