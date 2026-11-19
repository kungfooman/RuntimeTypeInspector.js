import vm from 'node:vm';
import {chainMatchesName} from './chainMatchesName.js';
const arrayName = 'Array';
// Plain arrays match at the first link, non-arrays never match.
function testDirectHitAndMiss() {
  return chainMatchesName([1, 2], arrayName) === true &&
    chainMatchesName({}, arrayName) === false &&
    chainMatchesName('nope', arrayName) === false;
}
// Same-realm subclasses match one link up, like instanceof does.
function testLocalSubclassMatches() {
  class MyArray extends Array {}
  return chainMatchesName(new MyArray(1, 2), arrayName) === true;
}
// Cross-realm subclasses fail instanceof but keep the chain, so the
// walk accepts the foreign MyArr instance the name check rejects.
function testForeignSubclassMatches() {
  const foreign = vm.runInNewContext('class MyArr extends Array {}; new MyArr(1, 2)');
  return (foreign instanceof Array) === false &&
    chainMatchesName(foreign, arrayName) === true;
}
// Plain cross-realm arrays still match at the first link.
function testForeignPlainMatches() {
  const foreign = vm.runInNewContext('[10, 20]');
  return chainMatchesName(foreign, arrayName) === true;
}
// A forged own `constructor.name` is data, not a chain link: the walk
// reads the real prototype's constructor, so the forgery fails.
function testForgedConstructorFails() {
  const forged = {
    constructor: {
      name: 'Array',
    },
  };
  return chainMatchesName(forged, arrayName) === false;
}
// Null-prototype objects and nullish values have no chain to walk.
function testNullishFailsClosed() {
  return chainMatchesName(Object.create(null), arrayName) === false &&
    chainMatchesName(null, arrayName) === false &&
    chainMatchesName(undefined, arrayName) === false;
}
const tests = [
  testDirectHitAndMiss,
  testLocalSubclassMatches,
  testForeignSubclassMatches,
  testForeignPlainMatches,
  testForgedConstructorFails,
  testNullishFailsClosed,
];
export {tests};
