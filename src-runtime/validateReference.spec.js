import {validateType} from './validateType.js';
import {validators} from './validators.js';
import {substituteType} from './substituteType.js';
import {registerTypedef, typedefs, bumpTypedefVersion} from './registerTypedef.js';
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
  const replaced = substituteType(expect, 'T', 'number', warn);
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
function testArrayLikeHolesFail() {
  // Holes read as `undefined`, not numbers: missing indices fail, and so
  // does the text-element shape (length-extended plain array, all holes).
  const expect = expandType('ArrayLike<number>');
  if (validateType({length: 2, 0: 1}, expect, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  const positions = [];
  positions.length = 12;
  if (validateType(positions, expect, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  return true;
}
function testArrayLikeDirectContract() {
  // Direct calls take the reference node (valid, invalid, bare-args
  // shape-only); a bare element means a stale direct call under the old
  // contract and fails loudly instead of passing everything as `any`.
  const direct = validators.validateArrayLike;
  const node = expandType('ArrayLike<number>');
  if (direct([1, 2], node, 'loc', 'name', true, warn, 0) !== true) {
    return false;
  }
  if (direct([1, '2'], node, 'loc', 'name', true, warn, 0) !== false) {
    return false;
  }
  if (direct([1, '2'], {type: 'reference', name: 'ArrayLike', args: []}, 'loc', 'name', true, warn, 0) !== true) {
    return false;
  }
  const warnings = [];
  if (direct([1], 'number', 'loc', 'name', true, (...args) => warnings.push(args[0]), 0) !== false) {
    return false;
  }
  return warnings.includes('unchecked');
}
function testGenericBranchFreshNodesValidate() {
  // Non-templated call sites emit a fresh reference node per call: two
  // structurally-equal nodes must validate identically, and the content-keyed
  // instantiation cache must not change which values pass or fail.
  registerTypedef('FreshBox', {type: 'object', properties: {v: 'T'}}, ['T']);
  try {
    const freshNode = () => expandType('FreshBox<number>');
    const okFirst = validateType({v: 1}, freshNode(), 'loc', 'name', true, warn, 0);
    const okSecond = validateType({v: 1}, freshNode(), 'loc', 'name', true, warn, 0);
    const badSecond = validateType({v: 'x'}, freshNode(), 'loc', 'name', true, warn, 0);
    return okFirst === true && okSecond === true && badSecond === false;
  } finally {
    delete typedefs.FreshBox;
    bumpTypedefVersion();
  }
}
function testGenericBranchRegistryUpdateSeen() {
  // Re-registering the generic body bumps the registry version: a fresh
  // node with equal content re-instantiates against the new body, so a
  // registry update is never masked by a stale cached instance.
  registerTypedef('UpdatedBox', {type: 'object', properties: {v: 'T'}}, ['T']);
  try {
    const before = validateType({v: 1}, expandType('UpdatedBox<number>'), 'loc', 'name', true, warn, 0);
    registerTypedef('UpdatedBox', {type: 'object', properties: {v: 'string'}}, ['T']);
    const nowInvalid = validateType({v: 1}, expandType('UpdatedBox<number>'), 'loc', 'name', true, warn, 0);
    const nowValid = validateType({v: 'x'}, expandType('UpdatedBox<number>'), 'loc', 'name', true, warn, 0);
    return before === true && nowInvalid === false && nowValid === true;
  } finally {
    delete typedefs.UpdatedBox;
    bumpTypedefVersion();
  }
}
function testAwaitedUnwrapsPromise() {
  // `Awaited<Promise<T>>` validates the fulfillment, not the wrapper: a
  // Promise is never assignable to its own awaited type (matching tsc),
  // only the resolved value is. Nested promises unwrap fully.
  if (!validateType(1, expandType('Awaited<Promise<number>>'), 'loc', 'name', true, warn, 0)) {
    return false;
  }
  if (!validateType('x', expandType('Awaited<Promise<string>>'), 'loc', 'name', true, warn, 0)) {
    return false;
  }
  if (!validateType(1, expandType('Awaited<Promise<Promise<number>>>'), 'loc', 'name', true, warn, 0)) {
    return false;
  }
  if (validateType(Promise.resolve(1), expandType('Awaited<Promise<number>>'), 'loc', 'name', true, warn, 0)) {
    return false;
  }
  if (validateType(null, expandType('Awaited<Promise<number>>'), 'loc', 'name', true, warn, 0)) {
    return false;
  }
  return true;
}
function testAwaitedPassesThroughNonPromise() {
  // Non-promise arguments are their own awaited type, exactly like tsc.
  if (!validateType(1, expandType('Awaited<number>'), 'loc', 'name', true, warn, 0)) {
    return false;
  }
  if (validateType('x', expandType('Awaited<number>'), 'loc', 'name', true, warn, 0)) {
    return false;
  }
  return true;
}
function testAwaitedNeedsArgument() {
  // A missing argument fails loudly instead of passing everything.
  const warnings = [];
  const ret = validateType(1, {type: 'reference', name: 'Awaited', args: []}, 'loc', 'name', true, (...args) => warnings.push(args[0]), 0);
  return ret === false && warnings.some((_) => typeof _ === 'string' && _.includes('Awaited requires one type argument'));
}
function testReturnTypeResolves() {
  // `ReturnType<() => T>` validates the declared return: tsc agrees both
  // ways, and the check needs no call (returns are unreadable at runtime).
  if (!validateType('x', expandType('ReturnType<() => string>'), 'loc', 'name', true, warn, 0)) {
    return false;
  }
  if (validateType(1, expandType('ReturnType<() => string>'), 'loc', 'name', true, warn, 0)) {
    return false;
  }
  if (!validateType(1, expandType('ReturnType<(a: number) => number>'), 'loc', 'name', true, warn, 0)) {
    return false;
  }
  return true;
}
function testReturnTypeNeedsFunction() {
  // Non-function arguments and missing returns fail loudly: without a
  // declared return there is nothing to validate against.
  const warnings = [];
  const bad = validateType(1, {type: 'reference', name: 'ReturnType', args: ['number']}, 'loc', 'name', true, (...args) => warnings.push(args[0]), 0);
  if (bad !== false || !warnings.some((_) => typeof _ === 'string' && _.includes('ReturnType requires a function type'))) {
    return false;
  }
  const missing = [];
  const noArg = validateType(1, {type: 'reference', name: 'ReturnType', args: []}, 'loc', 'name', true, (...args) => missing.push(args[0]), 0);
  return noArg === false && missing.some((_) => typeof _ === 'string' && _.includes('ReturnType requires one type argument'));
}
function testIntrinsicsEnforceCase() {
  // The four case intrinsics check values, not just stringness: tsc
  // agrees on every row below.
  const cases = [
    ['Uppercase<string>', 'ABC', true],
    ['Uppercase<string>', 'abc', false],
    ['Lowercase<string>', 'abc', true],
    ['Lowercase<string>', 'ABC', false],
    ['Capitalize<string>', 'Abc', true],
    ['Capitalize<string>', 'abc', false],
    ['Uncapitalize<string>', 'aBC', true],
    ['Uncapitalize<string>', 'Abc', false],
  ];
  for (const [type, value, want] of cases) {
    if (validateType(value, expandType(type), 'loc', 'name', true, warn, 0) !== want) {
      return false;
    }
  }
  return true;
}
function testIntrinsicsNeedStrings() {
  // Non-strings and missing arguments fail loudly instead of passing.
  if (validateType(1, expandType('Uppercase<string>'), 'loc', 'name', true, warn, 0)) {
    return false;
  }
  const warnings = [];
  const ret = validateType('x', {type: 'reference', name: 'Uppercase', args: []}, 'loc', 'name', true, (...args) => warnings.push(args[0]), 0);
  return ret === false && warnings.some((_) => typeof _ === 'string' && _.includes('Uppercase requires one type argument'));
}
function testReadonlyMapSet() {
  // Readonly-ness erases at runtime: element checks still apply exactly
  // like the mutable shapes, and non-collections fail.
  if (!validateType(new Map([['a', 1]]), expandType('ReadonlyMap<string, number>'), 'loc', 'name', true, warn, 0)) {
    return false;
  }
  if (validateType(new Map([['a', 'x']]), expandType('ReadonlyMap<string, number>'), 'loc', 'name', true, warn, 0)) {
    return false;
  }
  if (!validateType(new Set([1]), expandType('ReadonlySet<number>'), 'loc', 'name', true, warn, 0)) {
    return false;
  }
  if (validateType(new Set(['x']), expandType('ReadonlySet<number>'), 'loc', 'name', true, warn, 0)) {
    return false;
  }
  return validateType({}, expandType('ReadonlyMap<string, number>'), 'loc', 'name', true, warn, 0) === false;
}
function testReadonlyCollectionsNeedArgs() {
  // Missing type arguments fail loudly instead of passing everything.
  const mapWarnings = [];
  const mapRet = validateType(new Map(), {type: 'reference', name: 'ReadonlyMap', args: ['string']}, 'loc', 'name', true, (...args) => mapWarnings.push(args[0]), 0);
  if (mapRet !== false || !mapWarnings.some((_) => typeof _ === 'string' && _.includes('ReadonlyMap requires two type arguments'))) {
    return false;
  }
  const setWarnings = [];
  const setRet = validateType(new Set(), {type: 'reference', name: 'ReadonlySet', args: []}, 'loc', 'name', true, (...args) => setWarnings.push(args[0]), 0);
  return setRet === false && setWarnings.some((_) => typeof _ === 'string' && _.includes('ReadonlySet requires one type argument'));
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
  testArrayLikeHolesFail,
  testArrayLikeDirectContract,
  testGenericBranchFreshNodesValidate,
  testGenericBranchRegistryUpdateSeen,
  testAwaitedUnwrapsPromise,
  testAwaitedPassesThroughNonPromise,
  testAwaitedNeedsArgument,
  testReturnTypeResolves,
  testReturnTypeNeedsFunction,
  testIntrinsicsEnforceCase,
  testIntrinsicsNeedStrings,
  testReadonlyMapSet,
  testReadonlyCollectionsNeedArgs,
];
