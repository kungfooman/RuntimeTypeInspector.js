import vm from 'node:vm';
import {validateGlobalConstructor} from './validateGlobalConstructor.js';
import './validateType.js';
const silent = () => undefined;
// Same-realm instances match by prototype chain, subclasses included.
function testLocalInstancePasses() {
  return validateGlobalConstructor(new Float32Array(2), 'Float32Array', 'loc', 'name', true, silent, 0) === true &&
    validateGlobalConstructor(new Uint8Array(2), 'Uint8Array', 'loc', 'name', true, silent, 0) === true;
}
// Live-shared cross-realm instances fail instanceof but keep the chain,
// so the chain walk accepts them.
function testForeignInstancePassesByName() {
  const foreign = vm.runInNewContext('new Float32Array(2)');
  return (foreign instanceof Float32Array) === false &&
    validateGlobalConstructor(foreign, 'Float32Array', 'loc', 'name', true, silent, 0) === true;
}
// Cross-realm subclasses fail instanceof AND the direct name check
// (their constructor is `MyArr`), but the chain names `Array` one link
// up, so the walk accepts them like instanceof would same-realm.
function testForeignSubclassPasses() {
  class MyArray extends Array {}
  const foreign = vm.runInNewContext('class MyArr extends Array {}; new MyArr(1, 2)');
  return (foreign instanceof Array) === false &&
    validateGlobalConstructor(foreign, 'Array', 'loc', 'name', true, silent, 0) === true &&
    validateGlobalConstructor(new MyArray(1, 2), 'Array', 'loc', 'name', true, silent, 0) === true;
}
// A forged own `constructor.name` is data, not a chain link: the walk
// reads the real prototype's constructor, so the forgery fails. The old
// direct-name fallback accepted this; the chain walk rejects it.
function testImpostorFails() {
  const impostor = {
    length: 2,
  };
  const forged = {
    constructor: {
      name: 'Float32Array',
    },
  };
  return validateGlobalConstructor(impostor, 'Float32Array', 'loc', 'name', true, silent, 0) === false &&
    validateGlobalConstructor(forged, 'Float32Array', 'loc', 'name', true, silent, 0) === false &&
    validateGlobalConstructor(2, 'Float32Array', 'loc', 'name', true, silent, 0) === false;
}
// Unknown names and non-string expects fail closed without throwing.
function testUnknownFailsClosed() {
  return validateGlobalConstructor(new Float32Array(2), 'Nope', 'loc', 'name', true, silent, 0) === false &&
    validateGlobalConstructor(new Float32Array(2), undefined, 'loc', 'name', true, silent, 0) === false;
}
export const tests = [
  testLocalInstancePasses,
  testForeignInstancePassesByName,
  testForeignSubclassPasses,
  testImpostorFails,
  testUnknownFailsClosed,
];
