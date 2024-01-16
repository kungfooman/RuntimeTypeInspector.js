import {createType               } from './createType.js';
import {registerTypedef, typedefs} from './registerTypedef.mjs';
/**
 * @template T
 * @typedef {{[K in keyof T]: T[K] extends object ? Unpack<T[K]> : T[K]}} Unpack
 */
/**
 * @typedef {{a: 'aa', b: 'bb', c: 'cc'}} Obj
 * @typedef {keyof Obj} ObjKeys
 * @typedef {ObjKeys} ObjKeysTypedef
 * @typedef {Unpack<ObjKeys>} ObjKeysUnpacked
 */
registerTypedef('Obj', {
  "type": "object",
  "properties": {
    "a": "'aa'",
    "b": "'bb'",
    "c": "'cc'"
  }
});
registerTypedef('ObjKeys', {
  "type": "keyof",
  "argument": "Obj"
});
registerTypedef('ObjKeysTypedef', "ObjKeys");
console.log("ObjKeys", typedefs.ObjKeys);
const newType = createType("ObjKeysTypedef", console.warn);
console.log('newType', newType);
function test1() {
  /** @type {import('./validateUnion.mjs').Union} */
  const t = createType("ObjValuesTypedef2", console.warn);
  if (!t) {
    console.warn('t is not defined.');
    return false;
  }
  if (t.type !== 'union') {
    console.warn('t is not an union.');
    return false;
  }
  if (t.members.length !== 3) {
    console.warn('t should have three union members.');
    return false;
  }
  if (t.members[0] !== 'a') {
    console.warn("t.elements[0] should be 'a'");
    return false;
  }
  if (t.members[1] !== 'b') {
    console.warn("t.elements[1] should be 'b'");
    return false;
  }
  if (t.members[2] !== 'c') {
    console.warn("t.elements[2] should be 'c'");
    return false;
  }
  return true;
}
export const tests = [
  test1,
];
