/**
 * @typedef {{a: 'aa', b: "bb", c: 'cc'}} Obj
 * @typedef {{a: 0, b: '', c: undefined, d: null}} ObjTestcase
 * @typedef {Obj[keyof Obj]} ObjValues
 * @typedef {ObjTestcase[keyof ObjTestcase]} ObjValuesTestcase - Should be "" | 0 | null | undefined
 */
const t = createType('ObjValues', console.log);
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
