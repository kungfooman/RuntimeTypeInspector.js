import vm from 'node:vm';
import {validateGlobalConstructor} from './validateGlobalConstructor.js';
import './validateType.js';
const silent = () => undefined;
// Same-realm instances match by prototype chain, subclasses included.
function testLocalInstancePasses() {
  return validateGlobalConstructor(new Float32Array(2), 'Float32Array', 'loc', 'name', true, silent, 0) === true &&
    validateGlobalConstructor(new Uint8Array(2), 'Uint8Array', 'loc', 'name', true, silent, 0) === true;
}
// Live-shared cross-realm instances fail instanceof but carry the
// universal constructor name, so the name fallback accepts them.
function testForeignInstancePassesByName() {
  const foreign = vm.runInNewContext('new Float32Array(2)');
  return (foreign instanceof Float32Array) === false &&
    validateGlobalConstructor(foreign, 'Float32Array', 'loc', 'name', true, silent, 0) === true;
}
// A same-named impostor shape is not the platform constructor: plain
// data with matching structure but no constructor name fails.
function testImpostorFails() {
  return validateGlobalConstructor({length: 2}, 'Float32Array', 'loc', 'name', true, silent, 0) === false &&
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
  testImpostorFails,
  testUnknownFailsClosed,
];
