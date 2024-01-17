import {createType     } from './createType.js';
import {registerTypedef} from './registerTypedef.mjs';
function prepare() {
  /**
   * @typedef {{a: 'aa', b: 'bb', c: 'cc'}} Obj
   * @typedef {Obj[keyof Obj]} ObjValues
   * @typedef {ObjValues} ObjValuesTypedef
   * @typedef {ObjValuesTypedef} ObjValuesTypedef2
   */
  registerTypedef('Obj', {
    "type": "object",
    "properties": {
      "a": "'aa'",
      "b": "\"bb\"",
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
}
function test1() {
  prepare();
  /** @type {import('./validateUnion.mjs').Union} */
  // @ts-ignore
  const t = createType("ObjValuesTypedef2", console.warn);
  if (!t) {
    console.warn('createType: t is not defined.');
    return false;
  }
  if (t.type !== 'union') {
    console.warn('t is not an union.', t);
    return false;
  }
  if (t.members.length !== 3) {
    console.warn('t should have three union members.');
    return false;
  }
  if (t.members[0] !== 'aa') {
    console.warn(`Value for t.members[0] should be 'aa', but got '${t.members[0]}'.`);
    return false;
  }
  if (t.members[1] !== 'bb') {
    console.warn(`Value for t.members[1] should be 'aa', but got '${t.members[1]}'.`);
    return false;
  }
  if (t.members[2] !== 'cc') {
    console.warn(`Value for t.members[2] should be 'aa', but got '${t.members[2]}'.`);
    return false;
  }
  return true;
}
export const tests = [
  test1,
];
