import {validateArrayLikeSparse} from './validateArrayLikeSparse.js';
import {expandType} from '../src-transpiler/expandType.js';
const warn = () => undefined;
const numbers = () => expandType('Array<number>');
const likeNumbers = () => expandType('ArrayLike<number>');
function testDensePasses() {
  // Dense valid arrays pass like the strict validator.
  return validateArrayLikeSparse([1, 2, 3], numbers(), 'loc', 'name', true, warn, 0) === true &&
    validateArrayLikeSparse([1, 2, 3], likeNumbers(), 'loc', 'name', true, warn, 0) === true;
}
function testWrongElementFails() {
  // Present-but-wrong values fail, strings included, both shapes.
  return validateArrayLikeSparse(['a', 'b', 'c'], numbers(), 'loc', 'name', true, warn, 0) === false &&
    validateArrayLikeSparse([1, 'x', 3], likeNumbers(), 'loc', 'name', true, warn, 0) === false;
}
function testExplicitUndefinedFails() {
  // Explicit `undefined` is present, not absent: it fails, mixed in too.
  return validateArrayLikeSparse([undefined], numbers(), 'loc', 'name', true, warn, 0) === false &&
    validateArrayLikeSparse([1, undefined, 2], likeNumbers(), 'loc', 'name', true, warn, 0) === false;
}
function testHolesSkipped() {
  // Absent indices are skipped: length-extended, preallocated and
  // object-shaped ArrayLikes with holes all pass.
  const grown = [1];
  grown.length = 3;
  return validateArrayLikeSparse(grown, numbers(), 'loc', 'name', true, warn, 0) === true &&
    validateArrayLikeSparse(new Array(3), numbers(), 'loc', 'name', true, warn, 0) === true &&
    validateArrayLikeSparse({length: 2, 0: 1}, likeNumbers(), 'loc', 'name', true, warn, 0) === true;
}
function testElementTypeGeneric() {
  // Any element type works: holey string arrays pass, mixed fail.
  const sparse = ['a'];
  sparse.length = 3;
  return validateArrayLikeSparse(sparse, expandType('Array<string>'), 'loc', 'name', true, warn, 0) === true &&
    validateArrayLikeSparse(['a', 1], expandType('ArrayLike<string>'), 'loc', 'name', true, warn, 0) === false;
}
function testBadShapesFail() {
  // Non-containers, bad lengths and non-container expects fail closed.
  return validateArrayLikeSparse(null, numbers(), 'loc', 'name', true, warn, 0) === false &&
    validateArrayLikeSparse(42, likeNumbers(), 'loc', 'name', true, warn, 0) === false &&
    validateArrayLikeSparse([1], 'number', 'loc', 'name', true, warn, 0) === false &&
    validateArrayLikeSparse([1], {type: 'array'}, 'loc', 'name', true, warn, 0) === false;
}
function testBareArrayLikeIsShapeOnly() {
  // Bare `ArrayLike` (no args) checks shape only, like the strict branch.
  return validateArrayLikeSparse([1, '2'], {type: 'reference', name: 'ArrayLike', args: []}, 'loc', 'name', true, warn, 0) === true &&
    validateArrayLikeSparse({}, {type: 'reference', name: 'ArrayLike', args: []}, 'loc', 'name', true, warn, 0) === false;
}
const tests = [
  testDensePasses,
  testWrongElementFails,
  testExplicitUndefinedFails,
  testHolesSkipped,
  testElementTypeGeneric,
  testBadShapesFail,
  testBareArrayLikeIsShapeOnly,
];
export {tests};
