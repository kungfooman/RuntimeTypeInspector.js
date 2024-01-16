import {registerTypedef} from './registerTypedef.mjs';
import {resolveType    } from './resolveType.js';
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
function test1() {
  const res = resolveType('ObjValuesTypedef', 'indexedAccess');
  return res.object === 'Obj';
}
export const tests = [test1];
