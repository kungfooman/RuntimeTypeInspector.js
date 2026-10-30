import {firstBadEntry} from './firstBadEntry.js';
import {registerClass, classes} from './registerClass.js';
import {validators} from './validators.js';
import './validateType.js';
import {options} from './options.js';
import {customTypes} from './customTypes.js';
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
  return withScanClasses(() => firstBadEntry(new Map([[1, {x: 1}]]), 'number', 'Other') === -2 &&
    firstBadEntry(new Map([[1, new ScanBox()]]), 'number', 'ScanBox') === -1 &&
    firstBadEntry(new Map([[1, new ScanBox()], [2, new ScanOther()]]), 'number', 'ScanBox') === 1
  );
}
function testPrimitiveKeysAndValues() {
  // The three primitive aliases mirror their validators per entry.
  return firstBadEntry(new Map([[1, 'a'], ['x', 'b']]), 'number', 'string') === 1 &&
    firstBadEntry(new Map([[1, 'a'], [2, 3]]), 'number', 'string') === 1 &&
    firstBadEntry(new Map([['a', true], ['b', false]]), 'string', 'boolean') === -1 &&
    firstBadEntry(new Map([['a', true], ['b', 0]]), 'string', 'boolean') === 1;
}
function testCleanRegisteredClassVal() {
  // A map of registered-class instances scans clean in one pass.
  return withScanClasses(() => firstBadEntry(new Map([[1, new ScanBox(1)], [2, new ScanBox(2)], [3, new ScanBox(3)]]), 'number', 'ScanBox') === -1
  );
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
  return firstBadEntry(new Map([[1, 2], [2, NaN]]), undefined, 'number') === 1 &&
    firstBadEntry(new Map([[1, 2], [2, Infinity]]), undefined, 'number') === 1 &&
    firstBadEntry(new Map([[1, 2], [2, null]]), undefined, 'number') === 1 &&
    firstBadEntry(new Map([[1, 2], [2, '3']]), undefined, 'number') === 1;
}
function testInfinityOptOut() {
  // `options.checkInfinity === false` clears `Infinity`, like the validator.
  const prev = options.checkInfinity;
  try {
    options.checkInfinity = false;
    return firstBadEntry(new Map([[1, 2], [2, Infinity]]), undefined, 'number') === -1;
  } finally {
    options.checkInfinity = prev;
  }
}
function testReferenceNodeVal() {
  // A concrete `{type:'reference', name}` node mirrors the registered-class
  // `instanceof` branch of the reference validator.
  return withScanClasses(() => firstBadEntry(new Map([[1, new ScanBox(1)], [2, new ScanBox(2)]]), 'number', {type: 'reference', name: 'ScanBox'}) === -1 &&
    firstBadEntry(new Map([[1, new ScanBox(1)], [2, new ScanOther()]]), 'number', {type: 'reference', name: 'ScanBox'}) === 1
  );
}
function testUtilityNameBailsOut() {
  // Utility names (`Partial` and friends) never take the class branch of
  // the reference validator, so the scan must not distrust them.
  return withScanClasses(() => firstBadEntry(new Map([[1, new ScanBox(1)]]), 'number', {type: 'reference', name: 'Partial'}) === -2 &&
    firstBadEntry(new Map([[1, new ScanBox(1)]]), 'number', {type: 'reference', name: 'Iterable'}) === -2
  );
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
    const ref = (name, args) => ({type: 'reference', name, args});
    return firstBadEntry(new Map([['a', new ReadonlyMap()]]), 'string', ref('ReadonlyMap', ['string', 'number'])) === -2 &&
      firstBadEntry(new Map([[1, new ArrayLike()]]), 'number', ref('ArrayLike', ['number'])) === -2 &&
      firstBadEntry(new Map([[1, new Awaited()]]), 'number', ref('Awaited', [{type: 'promise', elementType: 'number'}])) === -2;
  } finally {
    delete classes.ReadonlyMap;
    delete classes.ArrayLike;
    delete classes.Awaited;
  }
}
function testComplexValBailsOut() {
  // Object nodes, unions and unknown names are full-loop territory.
  return firstBadEntry(new Map([[1, {x: 1}]]), 'number', {type: 'object'}) === -2 &&
    firstBadEntry(new Map([[1, 'a']]), 'number', {type: 'union', members: ['number', 'string']}) === -2 &&
    firstBadEntry(new Map([[1, 'a']]), 'number', 'NeverHeardOfIt') === -2;
}
function testComplexKeyBailsOut() {
  // Keys outside the specializer shapes keep the full loop; registered
  // class keys mirror the class scan exactly like values do.
  return withScanClasses(() => firstBadEntry(new Map([[new ScanBox(1), 'a']]), 'ScanNeverHeardOfIt', 'string') === -2 &&
    firstBadEntry(new Map([[new ScanBox(1), 'a']]), {type: 'object'}, 'string') === -2 &&
    firstBadEntry(new Map([[new ScanBox(1), 'a']]), 'ScanBox', 'string') === -1
  );
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
    return withScanClasses(() => firstBadEntry(new Map([[1, new ScanBox(1)]]), 'number', 'ScanBox') === -2 &&
      firstBadEntry(new Map([[new ScanBox(1), 'a']]), 'ScanBox', 'string') === -2
    );
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
  return firstBadEntry(new Map([[NaN, 'b'], [2, 7]]), 'number', 'number') === 0 &&
    firstBadEntry(new Map([[1, 'b'], [2, 7]]), 'number', 'string') === 1 &&
    firstBadEntry(new Map([[1, 1], [NaN, 2]]), 'number', 'number') === 1;
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
