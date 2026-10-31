import vm from 'node:vm';
import {registerClass} from './registerClass.js';
import {registerTypedef} from './registerTypedef.js';
import {validateType} from './validateType.js';
import {collectCandidates} from './collectCandidates.js';
import {tagSnapshot} from './tagSnapshot.js';
import {stringifyValue} from './stringifyValue.js';
import {explainMismatch} from './explainMismatch.js';
import {describeValueType} from './describeValue.js';
import {isPromiseValue} from './isPromiseValue.js';
import {expandType} from '../src-transpiler/expandType.js';
import {setOptions, options} from './options.js';
import './validateType.js';
class LiveBox {
  constructor() {
    this.w = 1;
  }
  spin() {
    return this.w;
  }
}
class LiveVec {
  constructor() {
    Object.assign(this, {x: 0, y: 0});
  }
}
function prepareLiveTower() {
  for (const cls of [LiveBox, LiveVec]) {
    registerClass(cls);
  }
  // Shapes come through the parser like every other spec input, so a
  // parser regression breaks these tests instead of silently passing
  // against a stale hand-written shape.
  registerTypedef('LiveBox', expandType('{w: number, spin: Function}'));
  registerTypedef('LiveVec', expandType('{x: number, y: number}'));
}
const silent = () => undefined;
// Every hostile case below runs the SAME value shape twice: once built
// locally, once built in a foreign realm and shared live without cloning.
// The verdicts must agree exactly — the realm boundary is transport, never
// semantics. `vm.runInNewContext` models the iframe boundary: prototypes
// differ, brands and structure do not.
function bothRealms(build) {
  return [build(), vm.runInNewContext(`(${build.toString()})()`)];
}
function checkBoth(build, expect) {
  const builtLocal = build();
  const builtForeign = vm.runInNewContext(`(${build.toString()})()`);
  const goodLocal = validateType(builtLocal, expect, 'loc', 'name', true, silent, 0);
  const goodForeign = validateType(builtForeign, expect, 'loc', 'name', true, silent, 0);
  return goodLocal === true && goodForeign === true;
}
function checkBothFail(build, expect) {
  // Hostile counterpart: mistyped values must STILL fail in both realms.
  // Realm-safe checks must never become blanket acceptance.
  const builtLocal = build();
  const builtForeign = vm.runInNewContext(`(${build.toString()})()`);
  const goodLocal = validateType(builtLocal, expect, 'loc', 'name', true, silent, 0);
  const goodForeign = validateType(builtForeign, expect, 'loc', 'name', true, silent, 0);
  return goodLocal === false && goodForeign === false;
}
// Foreign arrays validate wherever locals do: plain arrays, tuples, and
// nested members. Tuple members also pin the element unpack path.
function testForeignArraysValidate() {
  const arrayExpect = expandType('number[]');
  const tupleExpect = expandType('[number, string]');
  return checkBoth(() => [1, 2, 3], arrayExpect) &&
    checkBoth(() => [1, 'a'], tupleExpect);
}
// Foreign maps and sets validate with entry checks intact: keys and
// values each run their own validator, in both realms.
function testForeignMapsValidate() {
  const mapSrc = `new Map([
    ["a", 1],
  ])`;
  const setSrc = `new Set([
    1,
    2,
  ])`;
  const foreignMap = vm.runInNewContext(mapSrc);
  const foreignSet = vm.runInNewContext(setSrc);
  const mapExpect = expandType('Map<string, number>');
  const setExpect = expandType('Set<number>');
  const goodLocalMap = validateType(new Map([['a', 1]]), mapExpect, 'loc', 'name', true, silent, 0);
  const goodForeignMap = validateType(foreignMap, mapExpect, 'loc', 'name', true, silent, 0);
  const goodLocalSet = validateType(new Set([1, 2]), setExpect, 'loc', 'name', true, silent, 0);
  const goodForeignSet = validateType(foreignSet, setExpect, 'loc', 'name', true, silent, 0);
  return goodLocalMap === true && goodForeignMap === true &&
    goodLocalSet === true && goodForeignSet === true;
}
// Foreign promises are promises (brand, not constructor); thenables are
// not promises in any realm. Awaiting behavior is unobservable either way.
function testForeignPromisePassesThenableFails() {
  const foreignPromise = vm.runInNewContext('Promise.resolve(1)');
  const thenable = {then() {}};
  const promiseExpect = expandType('Promise<number>');
  const goodForeign = validateType(foreignPromise, promiseExpect, 'loc', 'name', true, silent, 0);
  const badThenable = validateType(thenable, promiseExpect, 'loc', 'name', true, silent, 0);
  return isPromiseValue(foreignPromise) === true && isPromiseValue(thenable) === false &&
    goodForeign === true && badThenable === false;
}
// A genuine foreign iterable passes the Iterable branch; a plain object
// fails it in both realms. The foreign generator function exercises the
// cross-realm `typeof function` path the old instanceof check rejected.
function testForeignIterablePasses() {
  const iterableExpect = expandType('Iterable<number>');
  const src = `({
    [Symbol.iterator]: function* () {
      yield 1;
    },
  })`;
  const foreign = vm.runInNewContext(src);
  const goodForeign = validateType(foreign, iterableExpect, 'loc', 'name', true, silent, 0);
  return goodForeign === true && checkBothFail(() => ({nope: 1}), iterableExpect);
}
// Template inference collects from foreign arrays element-wise: one
// candidate per element, each naming the same template key.
function testForeignArrayCandidates() {
  const arrayOfT = expandType('Array<T>');
  const outLocal = collectCandidates([1, 2], arrayOfT);
  const outForeign = collectCandidates(vm.runInNewContext('[1, 2]'), arrayOfT);
  return outLocal.length === 2 && outForeign.length === 2 &&
    outForeign.every((candidate) => candidate.key === 'T');
}
// Instances nested in foreign maps keep their tags through traversal:
// the map itself is a container (no tag), the instance inside is tagged.
function testForeignMapNestingTagged() {
  prepareLiveTower();
  const foreignMap = vm.runInNewContext('new Map()');
  foreignMap.set('box', new LiveBox());
  const tagged = tagSnapshot({m: foreignMap});
  return tagged.m.$type === undefined && tagged.m.get('box').$type === 'LiveBox';
}
// Foreign map entries survive log serialization as entries, not `{}`:
// the snapshot keeps the Map brand, size, and walked entries.
function testForeignMapStringified() {
  const src = `new Map([
    ["a", 1],
  ])`;
  const snap = stringifyValue({m: vm.runInNewContext(src)});
  return snap.m.$type === 'Map' && Array.isArray(snap.m.entries) && snap.m.entries.length === 1 &&
    snap.m.entries[0][0] === 'a' && snap.m.entries[0][1] === 1;
}
// Mistyped foreign values still fail everywhere: data mismatch, wrong
// prop type, and missing required key each fail in both realms.
function testForeignMistypedStillFails() {
  prepareLiveTower();
  const boxExpect = expandType('{w: number}');
  return checkBothFail(() => [1, 'x'], expandType('number[]')) &&
    checkBothFail(() => ({w: 'x'}), boxExpect) &&
    checkBothFail(() => ({x: 0}), expandType('{x: number, y: number}'));
}
// A foreign tagged snapshot with the wrong tag fails nominal checks:
// tag trust is exact-match only, never fuzzy.
function testForeignWrongTagFails() {
  prepareLiveTower();
  const src = `({
    w: 1,
    $type: "Nope",
  })`;
  const foreign = vm.runInNewContext(src);
  return validateType(foreign, 'LiveBox', 'loc', 'name', true, silent, 0) === false;
}
// A foreign same-spelled instance validates where nominal identity cannot
// cross (Partial of a class): the reference validator falls through its
// nominal shortcut to the structural shape, which a genuine instance
// satisfies via its own prototype. A same-spelled foreign instance is NOT
// nominally the local class, so only the shape admits it.
function testForeignInstancePassesPartial() {
  prepareLiveTower();
  const partialBox = expandType('Partial<LiveBox>');
  const goodLocal = validateType(new LiveBox(), partialBox, 'loc', 'name', true, silent, 0);
  const src = `new (class LiveBox {
    constructor() {
      this.w = 1;
    }
    spin() {
      return this.w;
    }
  })()`;
  const foreignTwin = vm.runInNewContext(src);
  const goodForeign = validateType(foreignTwin, partialBox, 'loc', 'name', true, silent, 0);
  return goodLocal === true && goodForeign === true;
}
// A live instance validates nominally even with a mistyped data prop:
// the checker trusts the instance identity (same as tsc trusting the
// declared type), while the differ still reports the genuine data defect
// structurally. That split is deliberate: the misleading kind of row is
// the union's "matches no union member" for a value some member accepts,
// which the last-resort passes-gate suppresses; a direct member row names
// a real defect. The comparator only diffs reported failures, so this
// row can only appear next to a genuine failure elsewhere.
function testDeepForeignNestingPinpoints() {
  prepareLiveTower();
  const rowsExpect = expandType('{rows: Array<Map<string, LiveBox>>}');
  const goodMap = vm.runInNewContext('new Map()');
  goodMap.set('a', new LiveBox());
  const goodSrc = `({
    rows: [],
  })`;
  const goodForeign = vm.runInNewContext(goodSrc);
  goodForeign.rows.push(goodMap);
  const good = validateType(goodForeign, rowsExpect, 'loc', 'name', true, silent, 0);
  if (good !== true) {
    return false;
  }
  const badBox = new LiveBox();
  badBox.w = 'x';
  const badMap = vm.runInNewContext('new Map()');
  badMap.set('a', badBox);
  const badSrc = `({
    rows: [],
  })`;
  const badForeign = vm.runInNewContext(badSrc);
  badForeign.rows.push(badMap);
  const badVerdict = validateType(badForeign, rowsExpect, 'loc', 'name', true, silent, 0);
  const {findings} = explainMismatch(badForeign, rowsExpect, 'data');
  return badVerdict === true && findings.length === 1 && findings[0].path === "data.rows[0].get('a').w";
}
// A genuinely mistyped PLAIN value still reports exactly its path: no
// nominal trust applies without an instance or tag, so the structural
// walk names the leaf with no sibling noise.
function testDeepForeignPlainPinpoints() {
  prepareLiveTower();
  const rowsExpect = expandType('{rows: Array<Map<string, LiveBox>>}');
  const src = `({
    rows: [
      new Map([
        ["a", {w: "x", spin: () => 1}],
      ]),
    ],
  })`;
  const badForeign = vm.runInNewContext(src);
  const badVerdict = validateType(badForeign, rowsExpect, 'loc', 'name', true, silent, 0);
  const {findings} = explainMismatch(badForeign, rowsExpect, 'data');
  return badVerdict === false && findings.length === 1 && findings[0].path === "data.rows[0].get('a').w";
}
// Frozen foreign arrays validate like frozen local ones; sparse arrays
// fail identically in both realms (holes are not valid elements).
function testForeignExoticArrays() {
  const arrayExpect = expandType('number[]');
  const frozenForeign = vm.runInNewContext('Object.freeze([1, 2])');
  const goodFrozen = validateType(frozenForeign, arrayExpect, 'loc', 'name', true, silent, 0);
  const sparseSrc = `const a = [1, 2];
a.length = 4;
a`;
  const sparseForeign = vm.runInNewContext(sparseSrc);
  const badSparseForeign = validateType(sparseForeign, arrayExpect, 'loc', 'name', true, silent, 0);
  const sparseLocal = [1, 2, ...new Array(2)];
  const badSparseLocal = validateType(sparseLocal, arrayExpect, 'loc', 'name', true, silent, 0);
  return goodFrozen === true && badSparseForeign === false && badSparseLocal === false;
}
// Array-like foreign objects validate by shape: a length-carrier with
// numeric indices and no Array brand still satisfies ArrayLike.
function testForeignArrayLike() {
  return checkBoth(() => ({0: 1, 1: 2, length: 2}), expandType('ArrayLike<number>'));
}
// Proxies forward brands: a proxy around a foreign array is an array,
// since Array.isArray sees through the proxy to the target.
function testForeignProxyArray() {
  const proxied = new Proxy(vm.runInNewContext('[1, 2]'), {});
  return validateType(proxied, expandType('number[]'), 'loc', 'name', true, silent, 0) === true;
}
// Displays never throw on foreign exotics and keep returning strings:
// Map, Set, foreign instances and tagged snapshots all describe.
function testForeignDisplaysSurvive() {
  const mapSrc = `new Map([
    ["a", 1],
  ])`;
  const setSrc = `new Set([
    1,
  ])`;
  const classSrc = `new (class Foo {
    constructor() {
      this.x = 1;
    }
  })()`;
  const tagSrc = `({
    $type: "Color",
    r: 1,
  })`;
  const values = [
    vm.runInNewContext(mapSrc),
    vm.runInNewContext(setSrc),
    vm.runInNewContext(classSrc),
    vm.runInNewContext(tagSrc),
  ];
  return values.every((value) => typeof describeValueType(value) === 'string');
}
// A value the validator accepts must never grow a union row: with Exact
// objects off, excess keys are informational, so a union whose members
// only flag the extra key would print "matches no union member" for a
// passing value. The union last-resort passes-gate converts exactly this
// class to clean. Revert the gate and the phantom row returns.
function testExcessUnionStaysClean() {
  const unionExpect = expandType('{a: number} | {b: string}');
  const prev = options.exactObjects;
  setOptions({exactObjects: false});
  let verdict;
  let rows;
  try {
    verdict = validateType({a: 1, typo: 2}, unionExpect, 'loc', 'name', true, silent, 0);
    rows = explainMismatch({a: 1, typo: 2}, unionExpect, 'v').findings.length;
  } finally {
    setOptions({exactObjects: prev});
  }
  return verdict === true && rows === 0;
}
// A foreign array never contributes object-property candidates, even
// with expando props: arrays take the array branch, never the object
// walk. The `instanceof` version would walk the indices as properties.
function testForeignArraySkipsObjectBranch() {
  const foreign = vm.runInNewContext('[1, 2]');
  foreign.tag = 'x';
  const out = collectCandidates(foreign, expandType('{tag: T}'));
  return out.length === 0;
}
// Template inference collects positionally from foreign tuples: each
// element pairs with its positional template, like locals do.
function testForeignTupleCandidates() {
  const out = collectCandidates(vm.runInNewContext('[1, "a"]'), expandType('[T, U]'));
  return out.length === 2 && out[0].key === 'T' && out[0].literal === 1 &&
    out[1].key === 'U' && out[1].literal === '"a"';
}
// IArguments accepts foreign arguments-likes: iterator protocol plus
// integer length plus callee, like tsc's contract. The `typeof` iterator
// check (not `instanceof Function`) keeps it realm-safe.
function testForeignIArguments() {
  const src = `({
    0: "a",
    length: 1,
    callee: function () {},
    [Symbol.iterator]: Array.prototype.values,
  })`;
  const foreign = vm.runInNewContext(src);
  const goodForeign = validateType(foreign, 'IArguments', 'loc', 'name', true, silent, 0);
  const badSrc = `({
    nope: 1,
  })`;
  const badForeign = validateType(vm.runInNewContext(badSrc), 'IArguments', 'loc', 'name', true, silent, 0);
  return goodForeign === true && badForeign === false;
}
// Platform constructors validate foreign instances by constructor
// name: a cross-realm Float32Array is still a Float32Array by brand,
// while a same-named impostor shape is not.
function testForeignTypedArrayValidates() {
  const foreign = vm.runInNewContext('new Float32Array(2)');
  const good = validateType(foreign, 'Float32Array', 'loc', 'name', true, silent, 0);
  const bad = validateType({length: 2}, 'Float32Array', 'loc', 'name', true, silent, 0);
  return good === true && bad === false;
}
export const tests = [
  testForeignTypedArrayValidates,
  testForeignTupleCandidates,
  testForeignIArguments,
  testForeignArraySkipsObjectBranch,
  testExcessUnionStaysClean,
  testForeignArraysValidate,
  testForeignMapsValidate,
  testForeignPromisePassesThenableFails,
  testForeignIterablePasses,
  testForeignArrayCandidates,
  testForeignMapNestingTagged,
  testForeignMapStringified,
  testForeignMistypedStillFails,
  testForeignWrongTagFails,
  testForeignInstancePassesPartial,
  testDeepForeignNestingPinpoints,
  testDeepForeignPlainPinpoints,
  testForeignExoticArrays,
  testForeignArrayLike,
  testForeignProxyArray,
  testForeignDisplaysSurvive,
];
