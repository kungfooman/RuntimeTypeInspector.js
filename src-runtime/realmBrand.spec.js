import vm from 'node:vm';
import {isArrayValue} from './isArrayValue.js';
import {isMapValue} from './isMapValue.js';
import {isSetValue} from './isSetValue.js';
// Foreign-realm containers must pass: the panel diffs values shared live
// across iframe boundaries, where `instanceof` fails because each realm
// has its own constructors. Only the same-realm identity is pinned here;
// the verdict-path behavior is pinned by crossRealmDiagnosis.spec.js.
function testForeignArrayPasses() {
  const foreign = vm.runInNewContext('[0, 0, 1, 1]');
  return isArrayValue(foreign) === true && (foreign instanceof Array) === false;
}
// A length-carrying impostor is not an array in any realm.
function testArrayImpostorRejected() {
  return isArrayValue({length: 4, 0: 1}) === false && isArrayValue('nope') === false;
}
// Foreign maps and sets pass the brand check while instanceof fails.
function testForeignMapSetPass() {
  const foreignMap = vm.runInNewContext('new Map([[1, 2]])');
  const foreignSet = vm.runInNewContext('new Set([1])');
  return isMapValue(foreignMap) === true && (foreignMap instanceof Map) === false &&
    isSetValue(foreignSet) === true && (foreignSet instanceof Set) === false;
}
// Duck-typed impostors (right methods, wrong brand) are rejected.
function testMapSetImpostorRejected() {
  const fakeMap = {get() {}, set() {}, has() {}, size: 0};
  const fakeSet = {add() {}, has() {}, size: 0};
  return isMapValue(fakeMap) === false && isSetValue(fakeSet) === false &&
    isMapValue(new Map()) === true && isSetValue(new Set()) === true;
}
export const tests = [
  testForeignArrayPasses,
  testArrayImpostorRejected,
  testForeignMapSetPass,
  testMapSetImpostorRejected,
];
