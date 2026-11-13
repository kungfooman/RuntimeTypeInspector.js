import {validateType  } from './validateType.js';
import {validators    } from './validators.js';
import {substituteType} from './substituteType.js';
import {registerTypedef, typedefs, bumpTypedefVersion} from './registerTypedef.js';
import {expandType       } from '../src-transpiler/expandType.js';
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
  const ret = validateType(
    [1, 2, 3],
    expect,
    'test',
    'a',
    true,
    (...args) => {
      if (args[0] === 'unchecked') {
        unchecked = true;
      }
    },
    0,
  );
  return ret === true && unchecked === false;
}
function testIssue241ArrayLikeInvalid() {
  // test([1, 2, "3"]) must fail with an element error, not 'unchecked'.
  const expect = expandType('ArrayLike<number>');
  const warnings = [];
  const ret = validateType(
    [1, 2, '3'],
    expect,
    'test',
    'a',
    true,
    (...args) => {
      warnings.push(args[0]);
    },
    0,
  );
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
  const rightValue = {
    length: 2,
    0: 1,
    1: 2,
  };
  const passesRight = validateType(rightValue, expect, 'loc', 'name', true, warn, 0);
  const wrongValue = {
    length: 2,
    0: 1,
    1: 'x',
  };
  const acceptsWrong = validateType(wrongValue, expect, 'loc', 'name', true, warn, 0);
  if (passesRight === false || acceptsWrong) {
    return false;
  }
  return true;
}
function testArrayLikeRejectsBadShapes() {
  const expect = expandType('ArrayLike<number>');
  const acceptsNull = validateType(null, expect, 'loc', 'name', true, warn, 0);
  const acceptsUndefined = validateType(undefined, expect, 'loc', 'name', true, warn, 0);
  const acceptsNumber = validateType(42, expect, 'loc', 'name', true, warn, 0);
  const missingLength = {
    0: 1,
    1: 2,
  };
  const acceptsMissingLength = validateType(missingLength, expect, 'loc', 'name', true, warn, 0);
  const negativeLength = {
    length: -1,
    0: 1,
  };
  const acceptsNegative = validateType(negativeLength, expect, 'loc', 'name', true, warn, 0);
  const fractionalLength = {
    length: 1.5,
    0: 1,
  };
  const acceptsFractional = validateType(fractionalLength, expect, 'loc', 'name', true, warn, 0);
  if (acceptsNull || acceptsUndefined || acceptsNumber || acceptsMissingLength || acceptsNegative || acceptsFractional) {
    return false;
  }
  return true;
}
function testReadonlyArray() {
  const expect = expandType('ReadonlyArray<number>');
  const passesArray = validateType([1, 2, 3], expect, 'loc', 'name', true, warn, 0);
  const acceptsMixed = validateType([1, 2, '3'], expect, 'loc', 'name', true, warn, 0);
  // Array-like objects are not arrays, so ReadonlyArray must reject them.
  const arrayLike = {
    length: 1,
    0: 1,
  };
  const acceptsArrayLike = validateType(arrayLike, expect, 'loc', 'name', true, warn, 0);
  if (passesArray === false || acceptsMixed || acceptsArrayLike) {
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
  const bareReference = {
    type: 'reference',
    name: 'ArrayLike',
    args: [],
  };
  // Bare ArrayLike: shape-only check, any element type passes.
  const passesMixed = validateType([1, '2'], bareReference, 'loc', 'name', true, warn, 0);
  const acceptsEmpty = validateType({}, bareReference, 'loc', 'name', true, warn, 0);
  if (passesMixed === false || acceptsEmpty) {
    return false;
  }
  // DOM list aliases behave like ArrayLike.
  const nodeListOf = expandType('NodeListOf<number>');
  const rightList = {
    length: 1,
    0: 1,
  };
  const passesList = validateType(rightList, nodeListOf, 'loc', 'name', true, warn, 0);
  const wrongList = {
    length: 1,
    0: '1',
  };
  const acceptsWrongList = validateType(wrongList, nodeListOf, 'loc', 'name', true, warn, 0);
  if (passesList === false || acceptsWrongList) {
    return false;
  }
  return true;
}
function testUnknownReferenceIsUnchecked() {
  let sawUnchecked = false;
  const unknownReference = {
    type: 'reference',
    name: 'NopeNotReal',
    args: [],
  };
  const warnUnknown = (...args) => {
    if (args[0] === 'unchecked') {
      sawUnchecked = true;
    }
  };
  const ret = validateType(1, unknownReference, 'loc', 'name', true, warnUnknown, 0);
  return ret === false && sawUnchecked === true;
}
function testReferenceToTypedef() {
  clearTypedefs();
  registerTypedef('MyNum', 'number');
  const myNum = {
    type: 'reference',
    name: 'MyNum',
    args: [],
  };
  const passesNumber = validateType(1, myNum, 'loc', 'name', true, warn, 0);
  const acceptsString = validateType('1', myNum, 'loc', 'name', true, warn, 0);
  if (passesNumber === false || acceptsString) {
    return false;
  }
  return true;
}
function testReplaceTypeHandlesReference() {
  // @template T ... ArrayLike<T> must support T substitution via inspectTypeWithTemplates.
  const expect = expandType('ArrayLike<T>');
  const replaced = substituteType(expect, 'T', 'number', warn);
  const numbers = {
    type: 'reference',
    name: 'ArrayLike',
    args: ['number'],
  };
  if (JSON.stringify(replaced) !== JSON.stringify(numbers)) {
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
  const numbers = {
    type: 'reference',
    name: 'ArrayLike',
    args: ['number'],
  };
  if (JSON.stringify(ref) !== JSON.stringify(numbers)) {
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
  const holeyValue = {
    length: 2,
    0: 1,
  };
  const acceptsHoley = validateType(holeyValue, expect, 'loc', 'name', true, warn, 0);
  const positions = [];
  positions.length = 12;
  const acceptsSparse = validateType(positions, expect, 'loc', 'name', true, warn, 0);
  if (acceptsHoley || acceptsSparse) {
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
  const passesDirect = direct([1, 2], node, 'loc', 'name', true, warn, 0) === true;
  const rejectsDirect = direct([1, '2'], node, 'loc', 'name', true, warn, 0) === false;
  const bare = {
    type: 'reference',
    name: 'ArrayLike',
    args: [],
  };
  const passesBare = direct([1, '2'], bare, 'loc', 'name', true, warn, 0) === true;
  const warnings = [];
  const warnDirect = (...args) => warnings.push(args[0]);
  const rejectsBare = direct([1], 'number', 'loc', 'name', true, warnDirect, 0) === false;
  if (passesDirect === false || rejectsDirect === false || passesBare === false || rejectsBare === false) {
    return false;
  }
  return warnings.includes('unchecked');
}
function testGenericBranchFreshNodesValidate() {
  // Non-templated call sites emit a fresh reference node per call: two
  // structurally-equal nodes must validate identically, and the content-keyed
  // instantiation cache must not change which values pass or fail.
  registerTypedef('FreshBox', {
    type: 'object',
    properties: {
      v: 'T',
    },
  }, ['T']);
  try {
    const freshNode = () => expandType('FreshBox<number>');
    const rightValue = {
      v: 1,
    };
    const okFirst = validateType(rightValue, freshNode(), 'loc', 'name', true, warn, 0);
    const okSecond = validateType(rightValue, freshNode(), 'loc', 'name', true, warn, 0);
    const wrongValue = {
      v: 'x',
    };
    const badSecond = validateType(wrongValue, freshNode(), 'loc', 'name', true, warn, 0);
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
  registerTypedef('UpdatedBox', {
    type: 'object',
    properties: {
      v: 'T',
    },
  }, ['T']);
  try {
    const rightNode = () => expandType('UpdatedBox<number>');
    const rightValue = {
      v: 1,
    };
    const before = validateType(rightValue, rightNode(), 'loc', 'name', true, warn, 0);
    registerTypedef('UpdatedBox', {
      type: 'object',
      properties: {
        v: 'string',
      },
    }, ['T']);
    const wrongValue = {
      v: 'x',
    };
    const nowInvalid = validateType(rightValue, rightNode(), 'loc', 'name', true, warn, 0);
    const nowValid = validateType(wrongValue, rightNode(), 'loc', 'name', true, warn, 0);
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
  const awaitedNumber = expandType('Awaited<Promise<number>>');
  const passesNumber = validateType(1, awaitedNumber, 'loc', 'name', true, warn, 0);
  const awaitedString = expandType('Awaited<Promise<string>>');
  const passesString = validateType('x', awaitedString, 'loc', 'name', true, warn, 0);
  const awaitedNested = expandType('Awaited<Promise<Promise<number>>>');
  const passesNested = validateType(1, awaitedNested, 'loc', 'name', true, warn, 0);
  const acceptsPromise = validateType(Promise.resolve(1), awaitedNumber, 'loc', 'name', true, warn, 0);
  const acceptsNull = validateType(null, awaitedNumber, 'loc', 'name', true, warn, 0);
  if (passesNumber === false || passesString === false || passesNested === false || acceptsPromise || acceptsNull) {
    return false;
  }
  return true;
}
function testAwaitedPassesThroughNonPromise() {
  // Non-promise arguments are their own awaited type, exactly like tsc.
  const awaitedNumber = expandType('Awaited<number>');
  const passesNumber = validateType(1, awaitedNumber, 'loc', 'name', true, warn, 0);
  const acceptsString = validateType('x', awaitedNumber, 'loc', 'name', true, warn, 0);
  if (passesNumber === false || acceptsString) {
    return false;
  }
  return true;
}
function testAwaitedNeedsArgument() {
  // A missing argument fails loudly instead of passing everything.
  const warnings = [];
  const missingArg = {
    type: 'reference',
    name: 'Awaited',
    args: [],
  };
  const warnMissing = (...args) => warnings.push(args[0]);
  const ret = validateType(1, missingArg, 'loc', 'name', true, warnMissing, 0);
  const sawHint = warnings.some((_) => typeof _ === 'string' && _.includes('Awaited requires one type argument'));
  return ret === false && sawHint;
}
function testReturnTypeResolves() {
  // `ReturnType<() => T>` validates the declared return: tsc agrees both
  // ways, and the check needs no call (returns are unreadable at runtime).
  const stringReturn = expandType('ReturnType<() => string>');
  const passesString = validateType('x', stringReturn, 'loc', 'name', true, warn, 0);
  const acceptsNumber = validateType(1, stringReturn, 'loc', 'name', true, warn, 0);
  const numberReturn = expandType('ReturnType<(a: number) => number>');
  const passesNumber = validateType(1, numberReturn, 'loc', 'name', true, warn, 0);
  if (passesString === false || acceptsNumber || passesNumber === false) {
    return false;
  }
  return true;
}
function testReturnTypeNeedsFunction() {
  // Non-function arguments and missing returns fail loudly: without a
  // declared return there is nothing to validate against.
  const warnings = [];
  const badReference = {
    type: 'reference',
    name: 'ReturnType',
    args: ['number'],
  };
  const warnBad = (...args) => warnings.push(args[0]);
  const bad = validateType(1, badReference, 'loc', 'name', true, warnBad, 0);
  const sawBadHint = warnings.some((_) => typeof _ === 'string' && _.includes('ReturnType requires a function type'));
  if (bad !== false || sawBadHint === false) {
    return false;
  }
  const missing = [];
  const missingReference = {
    type: 'reference',
    name: 'ReturnType',
    args: [],
  };
  const warnMissing = (...args) => missing.push(args[0]);
  const noArg = validateType(1, missingReference, 'loc', 'name', true, warnMissing, 0);
  const sawMissingHint = missing.some((_) => typeof _ === 'string' && _.includes('ReturnType requires one type argument'));
  return noArg === false && sawMissingHint;
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
  const uppercaseString = expandType('Uppercase<string>');
  const acceptsNumber = validateType(1, uppercaseString, 'loc', 'name', true, warn, 0);
  if (acceptsNumber) {
    return false;
  }
  const warnings = [];
  const missingArg = {
    type: 'reference',
    name: 'Uppercase',
    args: [],
  };
  const warnMissing = (...args) => warnings.push(args[0]);
  const ret = validateType('x', missingArg, 'loc', 'name', true, warnMissing, 0);
  const sawHint = warnings.some((_) => typeof _ === 'string' && _.includes('Uppercase requires one type argument'));
  return ret === false && sawHint;
}
function testReadonlyMapSet() {
  // Readonly-ness erases at runtime: element checks still apply exactly
  // like the mutable shapes, and non-collections fail.
  const readonlyMap = expandType('ReadonlyMap<string, number>');
  const passesMap = validateType(new Map([['a', 1]]), readonlyMap, 'loc', 'name', true, warn, 0);
  const acceptsWrongMap = validateType(new Map([['a', 'x']]), readonlyMap, 'loc', 'name', true, warn, 0);
  const readonlySet = expandType('ReadonlySet<number>');
  const passesSet = validateType(new Set([1]), readonlySet, 'loc', 'name', true, warn, 0);
  const acceptsWrongSet = validateType(new Set(['x']), readonlySet, 'loc', 'name', true, warn, 0);
  const acceptsPlain = validateType({}, readonlyMap, 'loc', 'name', true, warn, 0);
  if (passesMap === false || acceptsWrongMap || passesSet === false || acceptsWrongSet || acceptsPlain) {
    return false;
  }
  return true;
}
function testReadonlyCollectionsNeedArgs() {
  // Missing type arguments fail loudly instead of passing everything.
  const mapWarnings = [];
  const shortMap = {
    type: 'reference',
    name: 'ReadonlyMap',
    args: ['string'],
  };
  const warnMap = (...args) => mapWarnings.push(args[0]);
  const mapRet = validateType(new Map(), shortMap, 'loc', 'name', true, warnMap, 0);
  const sawMapHint = mapWarnings.some((_) => typeof _ === 'string' && _.includes('ReadonlyMap requires two type arguments'));
  if (mapRet !== false || sawMapHint === false) {
    return false;
  }
  const setWarnings = [];
  const emptySet = {
    type: 'reference',
    name: 'ReadonlySet',
    args: [],
  };
  const warnSet = (...args) => setWarnings.push(args[0]);
  const setRet = validateType(new Set(), emptySet, 'loc', 'name', true, warnSet, 0);
  const sawSetHint = setWarnings.some((_) => typeof _ === 'string' && _.includes('ReadonlySet requires one type argument'));
  return setRet === false && sawSetHint;
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
