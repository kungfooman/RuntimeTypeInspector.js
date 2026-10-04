import {tagValue} from './tagValue.js';
function testNullSplitFromObjects() {
  // `typeof null` is `'object'`, but null fails differently — it gets a tag.
  return tagValue(null) === 'null' && tagValue({}) !== 'null';
}
function testPrimitivesByTypeof() {
  // Primitives tag by `typeof`: no walks, no constructor lookups.
  return tagValue(undefined) === 'undefined' && tagValue(true) === 'boolean' &&
    tagValue(1) === 'number' && tagValue('x') === 'string' &&
    tagValue(1n) === 'bigint' && tagValue(Symbol('s')) === 'symbol';
}
function testObjectsByConstructor() {
  // Objects tag by constructor name: arrays, builtins and classes split,
  // prototype-less objects fall back to plain `'object'`.
  class Box {}
  return tagValue([]) === 'Array' && tagValue(new Map()) === 'Map' &&
    tagValue(new Uint8Array(1)) === 'Uint8Array' && tagValue(new Box()) === 'Box' &&
    tagValue(Object.create(null)) === 'object';
}
function testFunctionsTagByConstructor() {
  // Functions tag by constructor: sync and async split into distinct modes,
  // while every spelling of each stays put.
  return tagValue(() => {}) === 'Function' && tagValue(function named() {}) === 'Function' &&
    tagValue(async () => {}) === 'AsyncFunction';
}
function testExoticFallsBack() {
  // Revoked proxies throw on any touch (even `Array.isArray`): they fall
  // back instead of breaking the reporting path.
  const {proxy, revoke} = Proxy.revocable({}, {});
  revoke();
  return tagValue(proxy) === 'object';
}
function testThrowingGetterFallsBack() {
  // User data with throwing property access (framework proxies, DOM edges)
  // degrades to `'object'`: the handler exists so reporting never crashes
  // on the value it reports about.
  const evil = {};
  Object.defineProperty(evil, 'constructor', {get() {
    throw new Error('nope');
  }});
  return tagValue(evil) === 'object';
}
const tests = [
  testNullSplitFromObjects,
  testPrimitivesByTypeof,
  testObjectsByConstructor,
  testFunctionsTagByConstructor,
  testExoticFallsBack,
  testThrowingGetterFallsBack,
];
export {tests};
