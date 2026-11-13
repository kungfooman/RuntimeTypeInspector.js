import {validateArrayLikeSparse} from './validateArrayLikeSparse.js';
import {expandType             } from '../src-transpiler/expandType.js';
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
  const holeyLike = {
    length: 2,
    0: 1,
  };
  return (
    validateArrayLikeSparse(grown, numbers(), 'loc', 'name', true, warn, 0) === true &&
    validateArrayLikeSparse(new Array(3), numbers(), 'loc', 'name', true, warn, 0) === true &&
    validateArrayLikeSparse(holeyLike, likeNumbers(), 'loc', 'name', true, warn, 0) === true
  );
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
  const bare = {
    type: 'array',
  };
  return (
    validateArrayLikeSparse(null, numbers(), 'loc', 'name', true, warn, 0) === false &&
    validateArrayLikeSparse(42, likeNumbers(), 'loc', 'name', true, warn, 0) === false &&
    validateArrayLikeSparse([1], 'number', 'loc', 'name', true, warn, 0) === false &&
    validateArrayLikeSparse([1], bare, 'loc', 'name', true, warn, 0) === false
  );
}
function testBareArrayLikeIsShapeOnly() {
  // Bare `ArrayLike` (no args) checks shape only, like the strict branch.
  const bareLike = {
    type: 'reference',
    name: 'ArrayLike',
    args: [],
  };
  const pairPasses = validateArrayLikeSparse([1, '2'], bareLike, 'loc', 'name', true, warn, 0) === true;
  const emptyFails = validateArrayLikeSparse({}, bareLike, 'loc', 'name', true, warn, 0) === false;
  return pairPasses && emptyFails;
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
