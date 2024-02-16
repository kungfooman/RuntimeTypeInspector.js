import {registerTypedef} from './registerTypedef.js';
import {resolveType    } from './resolveType.js';
function prepare() {
  /**
   * @typedef {{a: 'aa', b: 'bb', c: 'cc'}} Obj
   * @typedef {Obj[keyof Obj]} ObjValues
   * @typedef {ObjValues} ObjValuesTypedef
   * @typedef {ObjValuesTypedef} ObjValuesTypedef2
   */
  // Upper typedef's create these:
  registerTypedef('Obj', {
    "type": "object",
    "properties": {
      "a": "'aa'",
      "b": "'bb'",
      "c": "'cc'"
    }
  });
  registerTypedef('ObjValues', {
    "type": "indexedAccess",
    "index": {
      "type": "keyof",
      "argument": "Obj"
    },
    "object": "Obj"
  });
  registerTypedef('ObjValuesTypedef', "ObjValues");
  registerTypedef('ObjValuesTypedef2', "ObjValuesTypedef");
  for (let i = 2; i < 30; i++) {
    registerTypedef(`ObjValuesTypedef${i + 1}`, `ObjValuesTypedef${i}`);
  }
}
function test1() {
  prepare();
  const res = resolveType('ObjValues', 'indexedAccess', console.warn);
  return res.object === 'Obj';
}
function test2() {
  prepare();
  const res = resolveType('ObjValuesTypedef', 'indexedAccess', console.warn);
  return res.object === 'Obj';
}
function test3() {
  prepare();
  const res = resolveType('ObjValuesTypedef2', 'indexedAccess', console.warn);
  return res.object === 'Obj';
}
function test4() {
  prepare();
  const res = resolveType('ObjValuesTypedef15', 'indexedAccess', console.warn);
  return res.object === 'Obj';
}
function test5() {
  prepare();
  let failed = false;
  resolveType('ObjValuesTypedef30', 'indexedAccess', () => failed = true);
  return failed; // should fail, because 20 is max depth
}
export const tests = [
  test1,
  test2,
  test3,
  test4,
  test5,
];
