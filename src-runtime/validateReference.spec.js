import {validateType} from './validateType.js';
import {replaceType} from './replaceType.js';
import {registerTypedef, typedefs} from './registerTypedef.js';
import {expandType} from '../src-transpiler/expandType.js';
import {expandTypeDepFree} from '../src-transpiler/expandTypeDepFree.js';
const warn = () => undefined;
/**
 * @param {Object<string, any>} obj - The object to clear.
 */
function clearTypedefs() {
  Object.keys(typedefs).forEach((_) => delete typedefs[_]);
}
function testIssue241ArrayLikeValid() {
  // ArrayLike<number> with a valid array must pass (no 'unchecked').
  const expect = expandType('ArrayLike<number>');
  let unchecked = false;
  const ret = validateType([1, 2, 3], expect, 'test', 'a', true, (...args) => {
    if (args[0] === 'unchecked') unchecked = true;
  }, 0);
  return ret === true && unchecked === false;
}
function testIssue241ArrayLikeInvalid() {
  // test([1, 2, "3"]) must fail with an element error, not 'unchecked'.
  const expect = expandType('ArrayLike<number>');
  const warnings = [];
  const ret = validateType([1, 2, '3'], expect, 'test', 'a', true, (...args) => {
    warnings.push(args[0]);
  }, 0);
  if (ret !== false) {
    return false;
  }
  if (warnings.includes('unchecked')) {
    return false;
  }
  return warnings.some((_) => typeof _ === 'string' && _.includes('index 2'));
}
function testArrayLikeObject() {
  const expect = expandType('ArrayLike<number>');
  if (!validateType({length: 2, 0: 1, 1: 2}, expect, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  if (validateType({length: 2, 0: 1, 1: 'x'}, expect, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  return true;
}
function testArrayLikeRejectsBadShapes() {
  const expect = expandType('ArrayLike<number>');
  if (validateType(null, expect, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  if (validateType(undefined, expect, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  if (validateType(42, expect, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  if (validateType({0: 1, 1: 2}, expect, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  if (validateType({length: -1, 0: 1}, expect, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  if (validateType({length: 1.5, 0: 1}, expect, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  return true;
}
function testReadonlyArray() {
  const expect = expandType('ReadonlyArray<number>');
  if (!validateType([1, 2, 3], expect, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  if (validateType([1, 2, '3'], expect, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  // Array-like objects are not arrays, so ReadonlyArray must reject them.
  if (validateType({length: 1, 0: 1}, expect, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  return true;
}
function testReadonlyPassthrough() {
  const expect = expandType('Readonly<number>');
  if (!validateType(1, expect, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  if (validateType('1', expect, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  return true;
}
function testNonNullable() {
  const expect = expandType('NonNullable<number>');
  if (!validateType(1, expect, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  if (validateType(null, expect, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  if (validateType(undefined, expect, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  return true;
}
function testArrayLikeBareAndAliases() {
  // Bare ArrayLike: shape-only check, any element type passes.
  if (!validateType([1, '2'], {type: 'reference', name: 'ArrayLike', args: []}, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  if (validateType({}, {type: 'reference', name: 'ArrayLike', args: []}, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  // DOM list aliases behave like ArrayLike.
  const nodeListOf = expandType('NodeListOf<number>');
  if (!validateType({length: 1, 0: 1}, nodeListOf, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  if (validateType({length: 1, 0: '1'}, nodeListOf, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  return true;
}
function testUnknownReferenceIsUnchecked() {
  let sawUnchecked = false;
  const ret = validateType(1, {type: 'reference', name: 'NopeNotReal', args: []}, 'loc', 'name', true, (...args) => {
    if (args[0] === 'unchecked') sawUnchecked = true;
  }, 0);
  return ret === false && sawUnchecked === true;
}
function testReferenceToTypedef() {
  clearTypedefs();
  registerTypedef('MyNum', 'number');
  if (!validateType(1, {type: 'reference', name: 'MyNum', args: []}, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  if (validateType('1', {type: 'reference', name: 'MyNum', args: []}, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  return true;
}
function testReplaceTypeHandlesReference() {
  // @template T ... ArrayLike<T> must support T substitution via inspectTypeWithTemplates.
  const expect = expandType('ArrayLike<T>');
  const replaced = replaceType(expect, 'T', 'number', warn);
  if (JSON.stringify(replaced) !== JSON.stringify({type: 'reference', name: 'ArrayLike', args: ['number']})) {
    return false;
  }
  if (!validateType([1, 2], replaced, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  if (validateType([1, '2'], replaced, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  return true;
}
function testExpandTypeDepFreeReference() {
  const ref = expandTypeDepFree('ArrayLike<number>');
  if (JSON.stringify(ref) !== JSON.stringify({type: 'reference', name: 'ArrayLike', args: ['number']})) {
    return false;
  }
  if (!validateType([1], ref, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  if (validateType(['1'], ref, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  return true;
}
export const tests = [
  testIssue241ArrayLikeValid,
  testIssue241ArrayLikeInvalid,
  testArrayLikeObject,
  testArrayLikeRejectsBadShapes,
  testReadonlyArray,
  testReadonlyPassthrough,
  testNonNullable,
  testArrayLikeBareAndAliases,
  testUnknownReferenceIsUnchecked,
  testReferenceToTypedef,
  testReplaceTypeHandlesReference,
  testExpandTypeDepFreeReference,
];
