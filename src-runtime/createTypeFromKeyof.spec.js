import {createType} from './createType.js';
import {expandType} from '../src-transpiler/expandType.js';
import {registerTypedef} from './registerTypedef.js';
function prepare() {
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
  // input: {type: 'object', properties: {a: "'aa'", b: "'bb'", c: "'cc'"}}
  registerTypedef('Obj', expandType('{a: \'aa\', b: \'bb\', c: \'cc\'}'));
  // input: {type: 'keyof', argument: 'Obj'}
  registerTypedef('ObjKeys', expandType('keyof Obj'));
  registerTypedef('ObjKeysTypedef', 'ObjKeys');
}
function test1() {
  prepare();
  /** @type {import('./validateUnion.js').Union} */
  const newType = createType('ObjKeysTypedef', console.warn);
  if (!newType) {
    console.warn('t is not defined.');
    return false;
  }
  const {type, members} = newType;
  if (type !== 'union') {
    console.warn('t is not an union.');
    return false;
  }
  if (members.length !== 3) {
    console.warn('t should have three union members.');
    return false;
  }
  if (members[0] !== 'a') {
    console.warn("t.elements[0] should be 'a'");
    return false;
  }
  if (members[1] !== 'b') {
    console.warn("t.elements[1] should be 'b'");
    return false;
  }
  if (members[2] !== 'c') {
    console.warn("t.elements[2] should be 'c'");
    return false;
  }
  return true;
}
export const tests = [
  test1,
];
