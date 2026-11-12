import {firstBadEntry} from './firstBadEntry.js';
import {registerClass, classes} from './registerClass.js';
import {validators} from './validators.js';
import './validateType.js';
import {options          } from './options.js';
import {customTypes      } from './customTypes.js';
import {customValidations} from './customValidations.js';
class ScanBox {
  constructor(x) {
    this.x = x;
  }
}
class ScanOther {
  constructor() {
    this.y = 1;
  }
}
/**
 * Registers scratch classes, runs the check, then removes them so later
 * specs observe a clean registry.
 * @param {Function} check - The assertion to run while registered.
 * @returns {boolean} The assertion result.
 */
function withScanClasses(check) {
  registerClass(ScanBox);
  registerClass(ScanOther);
  try {
    return check();
  } finally {
    delete classes.ScanBox;
    delete classes.ScanOther;
  }
}
function testExamplesVerbatim() {
  // The documented examples hold exactly.
  const check = () => {
    const plain = new Map([[1, {
      x: 1,
    }]]);
    const mismatch = firstBadEntry(plain, 'number', 'Other') === -2;
    const clean = new Map([[1, new ScanBox()]]);
    const cleanOk = firstBadEntry(clean, 'number', 'ScanBox') === -1;
    const mixed = new Map([[1, new ScanBox()], [2, new ScanOther()]]);
    const mixedOk = firstBadEntry(mixed, 'number', 'ScanBox') === 1;
    return mismatch && cleanOk && mixedOk;
  };
  return withScanClasses(check);
}
function testPrimitiveKeysAndValues() {
  // The three primitive aliases mirror their validators per entry.
  return (
    firstBadEntry(new Map([[1, 'a'], ['x', 'b']]), 'number', 'string') === 1 &&
    firstBadEntry(new Map([[1, 'a'], [2, 3]]), 'number', 'string') === 1 &&
    firstBadEntry(new Map([['a', true], ['b', false]]), 'string', 'boolean') === -1 &&
    firstBadEntry(new Map([['a', true], ['b', 0]]), 'string', 'boolean') === 1
  );
}
function testCleanRegisteredClassVal() {
  // A map of registered-class instances scans clean in one pass.
  const check = () => {
    const clean = new Map([[1, new ScanBox(1)], [2, new ScanBox(2)], [3, new ScanBox(3)]]);
    return firstBadEntry(clean, 'number', 'ScanBox') === -1;
  };
  return withScanClasses(check);
}
function testSubclassInstancesPass() {
  // `instanceof` accepts subclasses, unlike a constructor-name shortcut.
  return withScanClasses(() => {
    class ScanBoxChild extends ScanBox {}
    const map = new Map([[1, new ScanBoxChild(1)], [2, new ScanBox(2)]]);
    return firstBadEntry(map, 'number', 'ScanBox') === -1;
  });
}
function testAliasInstanceofMirror() {
  // A manually registered alias validates exactly like the full loop:
  // accepted unless neither constructor-name nor instanceof matches.
  return withScanClasses(() => {
    classes.ScanAlias = ScanBox;
    try {
      const clean = firstBadEntry(new Map([[1, new ScanBox(1)]]), 'number', 'ScanAlias') === -1;
      const mixedInstance = firstBadEntry(new Map([[1, new ScanOther()]]), 'number', 'ScanAlias') === 0;
      return clean && mixedInstance;
    } finally {
      delete classes.ScanAlias;
    }
  });
}
function testNaNInfinityNullAreSuspects() {
  // Everything `validateNumber` would reject (NaN, Infinity, null) stops
  // the scan at the entry position, never past it.
  const nanMap = new Map([[1, 2], [2, NaN]]);
  const infinityMap = new Map([[1, 2], [2, Infinity]]);
  const nullMap = new Map([[1, 2], [2, null]]);
  const textMap = new Map([[1, 2], [2, '3']]);
  return (
    firstBadEntry(nanMap, undefined, 'number') === 1 &&
    firstBadEntry(infinityMap, undefined, 'number') === 1 &&
    firstBadEntry(nullMap, undefined, 'number') === 1 &&
    firstBadEntry(textMap, undefined, 'number') === 1
  );
}
function testInfinityOptOut() {
  // `options.checkInfinity === false` clears `Infinity`, like the validator.
  const prev = options.checkInfinity;
  try {
    options.checkInfinity = false;
    const infinityMap = new Map([[1, 2], [2, Infinity]]);
    return firstBadEntry(infinityMap, undefined, 'number') === -1;
  } finally {
    options.checkInfinity = prev;
  }
}
function testReferenceNodeVal() {
  // A concrete `{type:'reference', name}` node mirrors the registered-class
  // `instanceof` branch of the reference validator.
  return withScanClasses(() => {
    const expect = {
      type: 'reference',
      name: 'ScanBox',
    };
    const clean = new Map([[1, new ScanBox(1)], [2, new ScanBox(2)]]);
    const cleanOk = firstBadEntry(clean, 'number', expect) === -1;
    const mixed = new Map([[1, new ScanBox(1)], [2, new ScanOther()]]);
    const mixedOk = firstBadEntry(mixed, 'number', expect) === 1;
    return cleanOk && mixedOk;
  });
}
function testUtilityNameBailsOut() {
  // Utility names (`Partial` and friends) never take the class branch of
  // the reference validator, so the scan must not distrust them.
  return withScanClasses(() => {
    const map = new Map([[1, new ScanBox(1)]]);
    const partialExpect = {
      type: 'reference',
      name: 'Partial',
    };
    const partialOk = firstBadEntry(map, 'number', partialExpect) === -2;
    const iterableExpect = {
      type: 'reference',
      name: 'Iterable',
    };
    const iterableOk = firstBadEntry(map, 'number', iterableExpect) === -2;
    return partialOk && iterableOk;
  });
}
function testUtilityNameCollisionBailsOut() {
  // Hostile registration: classes named exactly like utilities the
  // validator resolves first (ReadonlyMap, ArrayLike, Awaited). The scan
  // must still bail out instead of trusting `instanceof`, which would
  // report a verdict the validator does not agree with.
  class ReadonlyMap {}
  class ArrayLike {}
  class Awaited {}
  registerClass(ReadonlyMap);
  registerClass(ArrayLike);
  registerClass(Awaited);
  try {
    const ref = (name, args) => ({
      type: 'reference',
      name,
      args,
    });
    const readonlyMap = new Map([['a', new ReadonlyMap()]]);
    const readonlyOk = firstBadEntry(readonlyMap, 'string', ref('ReadonlyMap', ['string', 'number'])) === -2;
    const likeMap = new Map([[1, new ArrayLike()]]);
    const likeOk = firstBadEntry(likeMap, 'number', ref('ArrayLike', ['number'])) === -2;
    const awaitedMap = new Map([[1, new Awaited()]]);
    const awaitedExpect = ref('Awaited', [{
      type: 'promise',
      elementType: 'number',
    }]);
    const awaitedOk = firstBadEntry(awaitedMap, 'number', awaitedExpect) === -2;
    return readonlyOk && likeOk && awaitedOk;
  } finally {
    delete classes.ReadonlyMap;
    delete classes.ArrayLike;
    delete classes.Awaited;
  }
}
function testComplexValBailsOut() {
  // Object nodes, unions and unknown names are full-loop territory.
  const plain = new Map([[1, {
    x: 1,
  }]]);
  const objectExpect = {
    type: 'object',
  };
  const objectOk = firstBadEntry(plain, 'number', objectExpect) === -2;
  const textMap = new Map([[1, 'a']]);
  const unionExpect = {
    type: 'union',
    members: ['number', 'string'],
  };
  const unionOk = firstBadEntry(textMap, 'number', unionExpect) === -2;
  const unknownOk = firstBadEntry(textMap, 'number', 'NeverHeardOfIt') === -2;
  return objectOk && unionOk && unknownOk;
}
function testComplexKeyBailsOut() {
  // Keys outside the specializer shapes keep the full loop; registered
  // class keys mirror the class scan exactly like values do.
  return withScanClasses(() => {
    const plain = new Map([[new ScanBox(1), 'a']]);
    const unknownOk = firstBadEntry(plain, 'ScanNeverHeardOfIt', 'string') === -2;
    const objectExpect = {
      type: 'object',
    };
    const objectOk = firstBadEntry(plain, objectExpect, 'string') === -2;
    const classOk = firstBadEntry(plain, 'ScanBox', 'string') === -1;
    return unknownOk && objectOk && classOk;
  });
}
function testUserlandOverrideComposition() {
  // An overridden validator turns the scan off (bail), so overrides keep
  // composing through the full loop rather than being bypassed.
  const prev = validators.validateNumber;
  try {
    validators.validateNumber = () => true;
    const map = new Map([[1, 'a'], [NaN, 'b'], [3, 'c']]);
    return firstBadEntry(map, 'number', 'string') === -2;
  } finally {
    validators.validateNumber = prev;
  }
}
function testCustomValidationsFallBack() {
  // Registered custom validations veto before the scan, mirroring the
  // full loop's hook order: a hook makes the scan bail out entirely.
  customValidations.push(() => true);
  const map = new Map([[1, new ScanBox(1)]]);
  try {
    return withScanClasses(() => firstBadEntry(map, 'number', 'string') === -2);
  } finally {
    customValidations.pop();
  }
}
// A `customTypes` hook for a registered class vetoes the class scan: the
// full loop consults the hook before `instanceof`, so the scan must not
// trust `instanceof` past it, for values and keys alike.
function testCustomTypeHookBailsOut() {
  customTypes.ScanBox = () => false;
  try {
    const check = () => {
      const boxed = new Map([[1, new ScanBox(1)]]);
      const valueOk = firstBadEntry(boxed, 'number', 'ScanBox') === -2;
      const keyed = new Map([[new ScanBox(1), 'a']]);
      const keyOk = firstBadEntry(keyed, 'ScanBox', 'string') === -2;
      return valueOk && keyOk;
    };
    return withScanClasses(check);
  } finally {
    delete customTypes.ScanBox;
  }
}
function testEmptyMapScansClean() {
  // An empty map is clean under any fast path its key/val types allow.
  return firstBadEntry(new Map(), 'number', 'string') === -1;
}
function testMixedKeyValFailure() {
  // When key and value both specialize, first offender wins: key offender
  // at entry 1 vs string value at entry 0, plus a key-only offender.
  return (
    firstBadEntry(new Map([[NaN, 'b'], [2, 7]]), 'number', 'number') === 0 &&
    firstBadEntry(new Map([[1, 'b'], [2, 7]]), 'number', 'string') === 1 &&
    firstBadEntry(new Map([[1, 1], [NaN, 2]]), 'number', 'number') === 1
  );
}
const tests = [
  testExamplesVerbatim,
  testPrimitiveKeysAndValues,
  testCleanRegisteredClassVal,
  testSubclassInstancesPass,
  testAliasInstanceofMirror,
  testNaNInfinityNullAreSuspects,
  testInfinityOptOut,
  testReferenceNodeVal,
  testUtilityNameBailsOut,
  testUtilityNameCollisionBailsOut,
  testComplexValBailsOut,
  testComplexKeyBailsOut,
  testUserlandOverrideComposition,
  testCustomValidationsFallBack,
  testCustomTypeHookBailsOut,
  testEmptyMapScansClean,
  testMixedKeyValFailure,
];
export {tests};
