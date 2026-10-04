import {expandType} from '../src-transpiler/expandType.js';
import {registerTypedef, typedefs, typedefTemplates} from './registerTypedef.js';
import {registerClass, classes} from './registerClass.js';
import {options} from './options.js';
import {collectFailPaths, explainMismatch, materializeExpect} from './explainMismatch.js';
function reset() {
  Object.keys(typedefs).forEach((_) => delete typedefs[_]);
  Object.keys(typedefTemplates).forEach((_) => delete typedefTemplates[_]);
}
function testMissingKey() {
  reset();
  const expect = expandType('{fov: number, clearColor: Array<number>}');
  const {findings, stub} = explainMismatch({fov: 60}, expect, 'options');
  const missing = findings.find((_) => _.kind === 'missing');
  return !!missing && missing.path === 'options.clearColor' &&
    missing.fix.includes('clearColor') && stub.includes('clearColor');
}
function testWrongNestedType() {
  reset();
  const expect = expandType('{clearColor: Array<number>}');
  const {findings} = explainMismatch({clearColor: 'red'}, expect, 'options');
  return findings.length === 1 && findings[0].path === 'options.clearColor' &&
    findings[0].kind === 'wrong' && findings[0].fix.includes('options.clearColor');
}
function testGenericReferenceResolves() {
  reset();
  registerTypedef('Box', {type: 'object', properties: {content: 'T'}}, ['T']);
  const expect = expandType('Box<number>');
  const {findings} = explainMismatch({content: 'x'}, expect, 'box');
  if (findings.length !== 1 || findings[0].path !== 'box.content') {
    return false;
  }
  // And the materialized shape is concrete, not `T`.
  const mat = materializeExpect(expect);
  return mat?.properties?.content !== 'T' &&
    explainMismatch({content: 1}, expect, 'box').findings.length === 0;
}
function testUnionClosestMatch() {
  reset();
  const expect = expandType('"a" | {fov: number, clearColor: Array<number>}');
  const {findings} = explainMismatch({fov: 60}, expect, 'options');
  const union = findings.find((_) => _.kind === 'union');
  return !!union && union.detail.includes('closest') &&
    union.children.some((_) => _.path === 'options.clearColor' && _.kind === 'missing');
}
function testExtraKey() {
  reset();
  const expect = expandType('{fov: number}');
  const {findings} = explainMismatch({fov: 60, fovv: 60}, expect, 'options');
  return findings.some((_) => _.kind === 'extra' && _.path === 'options.fovv');
}
function testPassingValueHasNoFindings() {
  reset();
  const expect = expandType('{fov: number}');
  return explainMismatch({fov: 60}, expect, 'options').findings.length === 0;
}
function testIndexedAccessResolvesConcretely() {
  reset();
  registerTypedef('EntityShape', expandType('{camera: {fov: number}}'));
  const expect = expandType('EntityShape["camera"]');
  const {findings} = explainMismatch({fov: 'x'}, expect, 'data');
  return findings.length === 1 && findings[0].path === 'data.fov' &&
    findings[0].expected === 'number';
}
function testPartialRelaxesRequired() {
  reset();
  registerTypedef('Box', expandType('{a: number, b: string}'));
  const partial = explainMismatch({}, expandType('Partial<Box>'), 'p').findings;
  const required = explainMismatch({}, expandType('Required<Box>'), 'p').findings;
  return partial.length === 0 && required.length === 2;
}
function testPickNarrowsKeys() {
  reset();
  registerTypedef('Box', expandType('{a: number, b: string}'));
  const {findings} = explainMismatch({}, expandType('Pick<Box, "a">'), 'p');
  return findings.length === 1 && findings[0].path === 'p.a';
}
function testClassInstancePassesShape() {
  reset();
  class Widget {
    render() {}
  }
  registerClass(Widget);
  try {
    const ok = explainMismatch(new Widget(), 'Widget', 'w').findings;
    const bad = explainMismatch({}, 'Widget', 'w').findings;
    return ok.length === 0 && bad.length > 0;
  } finally {
    delete classes.Widget;
  }
}
function testPresentValuesLoseOptionalWrapper() {
  // A present-but-wrong value under Partial must read `'draft' | ...`,
  // not `('draft' | ...)|undefined` — presence settles optionality.
  reset();
  registerTypedef('Article', expandType('{title: string, status: "draft" | "published"}'));
  const {findings} = explainMismatch({title: 'x', status: 1}, expandType('Partial<Article>'), 'patch');
  const wrong = findings.find((_) => _.path === 'patch.status');
  return findings.length === 1 && !!wrong && !wrong.expected.includes('undefined');
}
function testOmitExcessNamesRemoval() {
  // The user's Omit case: a deliberately removed key must say so, never
  // suggest a typo.
  reset();
  registerTypedef('Account', expandType('{id: string, email: string, role: string}'));
  const {findings} = explainMismatch(
    {email: 'a', role: 'b', id: 1}, expandType('Omit<Account, "id">'), 'payload');
  const extra = findings.find((_) => _.path === 'payload.id');
  return findings.length === 1 && !!extra && extra.kind === 'extra' &&
    extra.detail.includes('deliberately removed by') && extra.detail.includes('Omit') &&
    extra.fix === 'Remove `payload.id`.' && !extra.detail.includes('spelling');
}
function testPickExcessNamesSelection() {
  reset();
  registerTypedef('User', expandType('{id: number, name: string}'));
  const {findings} = explainMismatch(
    {name: 'x', id: 1}, expandType('Pick<User, "name">'), 'user');
  const extra = findings.find((_) => _.path === 'user.id');
  return findings.length === 1 && !!extra &&
    extra.detail.includes('not selected by') && extra.detail.includes('Pick') &&
    extra.fix === 'Remove `user.id`.';
}
function testPlainExcessStillSuspectsTypo() {
  reset();
  const {findings} = explainMismatch(
    {fov: 60, fovv: 1}, expandType('{fov: number}'), 'options');
  const extra = findings.find((_) => _.path === 'options.fovv');
  return !!extra && extra.detail.includes('check spelling');
}
function testExtrasInformationalWhenLenient() {
  // Exact off: excess still renders (nothing silently vanishes) but marked
  // informational, without a fix imperative.
  reset();
  const prev = options.exactObjects;
  options.exactObjects = false;
  try {
    const {findings} = explainMismatch(
      {fov: 60, fovv: 1}, expandType('{fov: number}'), 'options');
    const extra = findings.find((_) => _.path === 'options.fovv');
    return !!extra && extra.info === true && !extra.fix &&
      extra.detail.includes('informational');
  } finally {
    options.exactObjects = prev;
  }
}
/**
 * Failure paths drive the Actual-pane highlight: every finding path lands
 * in the set, union pinpoints recurse through `children`, informational
 * extras stay out.
 * @returns {boolean} True when only real failures are collected.
 */
function testCollectFailPaths() {
  const paths = collectFailPaths([
    {path: 'a', kind: 'wrong'},
    {path: 'b', kind: 'extra', info: true},
    {path: 'c', kind: 'union', children: [{path: 'c', kind: 'wrong', children: [{path: "c.get('k')", kind: 'wrong'}]}]},
  ]);
  return paths.has('a') && paths.has('c') && paths.has("c.get('k')") &&
    !paths.has('b') && paths.size === 3;
}
/**
 * Empty and absent findings collect to nothing, never throw.
 * @returns {boolean} True when degenerate inputs stay empty.
 */
function testCollectFailPathsEmpty() {
  return collectFailPaths([]).size === 0 && collectFailPaths(null).size === 0 &&
    collectFailPaths(undefined).size === 0;
}
/**
 * End to end: the entry pinpoint of a `Map` mismatch is collected.
 * @returns {boolean} True when the `.get(…)` path is collected.
 */
function testCollectFailPathsMapMismatch() {
  reset();
  const {findings} = explainMismatch(new Map([['apiKey', null]]),
                                     expandType('Map<string, string | number>'), 'config');
  const paths = collectFailPaths(findings);
  return paths.has("config.get('apiKey')");
}
/**
 * A bad `Set` member carries its matched container: structure (not prose)
 * proves the shape was admitted — kind, path, expected, actual, container
 * and the closest-match child.
 * @returns {boolean} True when the finding carries its container.
 */
function testSetMemberUnionAdmitsShape() {
  reset();
  const {findings} = explainMismatch(new Set(['admin', true]),
                                     expandType('Set<string | number>'), 'items');
  if (findings.length !== 1) {
    return false;
  }
  const [finding] = findings;
  return finding.kind === 'union' && finding.path === 'items[1]' &&
    finding.expected === 'string | number' && finding.actual === 'true' &&
    finding.container === 'Set<string | number>' && finding.children.length === 1;
}
/**
 * A bad `Map` entry value carries its matched container, same as sets.
 * @returns {boolean} True when the finding carries its container.
 */
function testMapEntryUnionAdmitsShape() {
  reset();
  const {findings} = explainMismatch(new Map([['apiKey', null]]),
                                     expandType('Map<string, string | number>'), 'config');
  if (findings.length !== 1) {
    return false;
  }
  const [finding] = findings;
  return finding.kind === 'union' && finding.path === "config.get('apiKey')" &&
    finding.expected === 'string | number' && finding.actual === 'null' &&
    finding.container === 'Map<string, string | number>' && finding.children.length === 1;
}
/**
 * Plain property unions carry no container: only collection members admit
 * a shape. The subject is still pinned by path, expected and actual.
 * @returns {boolean} True when the finding names its subject structurally.
 */
function testPropertyUnionNamesSubject() {
  reset();
  const {findings} = explainMismatch({color: true},
                                     expandType('{color: string | number}'), 'options');
  if (findings.length !== 1) {
    return false;
  }
  const [finding] = findings;
  return finding.kind === 'union' && finding.path === 'options.color' &&
    finding.expected === 'string | number' && finding.actual === 'true' &&
    finding.container === undefined && finding.children.length === 1;
}
function testArrayBadElementPinpoints() {
  // A bad element blames its index, not the whole array.
  reset();
  const {findings} = explainMismatch([1, 'x', 3], {type: 'array', elementType: 'number'}, 'v');
  return findings.length === 1 && findings[0].path === 'v[1]' && findings[0].kind === 'wrong';
}
function testArrayValidEmpty() {
  // Valid arrays (direct and through unions) explain clean.
  reset();
  const arr = {type: 'array', elementType: 'number'};
  const union = {type: 'union', members: ['Nope', arr]};
  return explainMismatch([0, 0, 1, 1], arr, 'v').findings.length === 0 &&
    explainMismatch([0, 0, 1, 1], union, 'v').findings.length === 0;
}
function testArrayNonArray() {
  // Non-arrays blame the whole value, like map/set branches do.
  reset();
  const {findings} = explainMismatch('nope', {type: 'array', elementType: 'number'}, 'v');
  return findings.length === 1 && findings[0].path === 'v' && findings[0].kind === 'wrong';
}
function testArrayHolesPinpointed() {
  // Holes read as undefined and pinpoint, matching strict validation.
  reset();
  const grown = [1, 2, 3];
  grown.length = 5;
  const {findings} = explainMismatch(grown, {type: 'array', elementType: 'number'}, 'v');
  return findings.length === 2 && findings[0].path === 'v[3]' && findings[1].path === 'v[4]';
}
function testArrayBudgetFallback() {
  // Past the entry budget, one generic finding names the array (map/set parity).
  reset();
  const big = new Array(25).fill(1);
  big[24] = 'x';
  const {findings} = explainMismatch(big, {type: 'array', elementType: 'number'}, 'v');
  return findings.length === 1 && findings[0].path === 'v' && findings[0].kind === 'wrong';
}
function testTupleBadMemberPinpoints() {
  // A bad tuple member blames its position.
  reset();
  const {findings} = explainMismatch([1, 2], expandType('[number, string]'), 'v');
  return findings.length === 1 && findings[0].path === 'v[1]' && findings[0].kind === 'wrong';
}
function testTupleLengthMismatch() {
  // Short tuples blame the whole value with a length detail, like validation.
  reset();
  const {findings} = explainMismatch([1], expandType('[number, string]'), 'v');
  return findings.length === 1 && findings[0].path === 'v' && findings[0].kind === 'wrong';
}
function testTupleOptionalTail() {
  // A missing optional tail is fine; a present-but-wrong one pinpoints.
  reset();
  const optional = {type: 'tuple', elements: ['number', {type: 'tupleMember', elementType: 'string', optional: true}]};
  return explainMismatch([1], optional, 'v').findings.length === 0 &&
    explainMismatch([1, 2], optional, 'v').findings.length === 1;
}
function testTupleRestVariadic() {
  // Rest consumes the tail positionally; multiple variadics fail closed.
  reset();
  const rest = {type: 'tuple', elements: ['number', {type: 'rest', annotation: {type: 'array', elementType: 'string'}}]};
  const multi = {type: 'tuple', elements: [{type: 'rest', annotation: {type: 'array', elementType: 'string'}}, {type: 'rest', annotation: {type: 'array', elementType: 'number'}}]};
  const {findings: bad} = explainMismatch(['a', 'b'], rest, 'v');
  return explainMismatch([1, 'a', 'b'], rest, 'v').findings.length === 0 &&
    bad.length === 1 && bad[0].path === 'v[0]' &&
    explainMismatch([1], multi, 'v').findings.length === 1;
}
function testTupleNonArray() {
  // Non-arrays blame the whole value.
  reset();
  const {findings} = explainMismatch('nope', expandType('[number]'), 'v');
  return findings.length === 1 && findings[0].path === 'v' && findings[0].kind === 'wrong';
}
class SnapWidget {
  constructor() {
    this.w = 1;
  }
}
class SnapSubWidget extends SnapWidget {}
function prepareSnap() {
  reset();
  registerClass(SnapWidget);
  registerTypedef('SnapWidget', {type: 'object', properties: {w: 'number', run: 'Function'}});
}
function testTaggedSnapshotSkipsMethods() {
  // A tagged snapshot lost its methods in transit: absent methods are not defects.
  prepareSnap();
  const {findings} = explainMismatch({$type: 'SnapWidget', w: 1}, 'SnapWidget', 'v');
  return findings.length === 0;
}
function testUntaggedStaysStrictOnMethods() {
  // Without a tag there is no transport story: missing methods still report.
  prepareSnap();
  const {findings} = explainMismatch({w: 1}, 'SnapWidget', 'v');
  return findings.length === 1 && findings[0].kind === 'missing' && findings[0].path === 'v.run';
}
function testMismatchedTagStaysStrict() {
  // A tag naming another class does not excuse anything.
  prepareSnap();
  const {findings} = explainMismatch({$type: 'Nope', w: 1}, 'SnapWidget', 'v');
  return findings.length === 1 && findings[0].kind === 'missing' && findings[0].path === 'v.run';
}
function testSubclassTagMatches() {
  // Registered subclasses match nominally through the tag.
  prepareSnap();
  registerClass(SnapSubWidget);
  const {findings} = explainMismatch({$type: 'SnapSubWidget', w: 1}, 'SnapWidget', 'v');
  return findings.length === 0;
}
function testTaggedDataStillChecked() {
  // The tag excuses methods, not data: wrong data still pinpoints.
  prepareSnap();
  const {findings} = explainMismatch({$type: 'SnapWidget', w: 'x'}, 'SnapWidget', 'v');
  return findings.length === 1 && findings[0].kind === 'wrong' && findings[0].path === 'v.w';
}
function testDollarTypeNeverExcess() {
  // The envelope tag is metadata: present data excess still reports, `$type` never does.
  prepareSnap();
  const {findings} = explainMismatch({$type: 'SnapWidget', w: 1, bogus: 2}, 'SnapWidget', 'v');
  return findings.length === 1 && findings[0].path === 'v.bogus';
}
function testNominalTagShortCircuits() {
  // A tag naming an unresolvable class matches nominally instead of
  // failing closed: the class was proven at check time.
  prepareSnap();
  const {findings} = explainMismatch({$type: 'Ghost', w: 'wrong'}, 'Ghost', 'v');
  return findings.length === 0;
}
const tests = [
  testCollectFailPaths,
  testCollectFailPathsEmpty,
  testCollectFailPathsMapMismatch,
  testSetMemberUnionAdmitsShape,
  testMapEntryUnionAdmitsShape,
  testPropertyUnionNamesSubject,
  testMissingKey,
  testWrongNestedType,
  testGenericReferenceResolves,
  testUnionClosestMatch,
  testExtraKey,
  testPassingValueHasNoFindings,
  testIndexedAccessResolvesConcretely,
  testPartialRelaxesRequired,
  testPickNarrowsKeys,
  testClassInstancePassesShape,
  testPresentValuesLoseOptionalWrapper,
  testOmitExcessNamesRemoval,
  testPickExcessNamesSelection,
  testPlainExcessStillSuspectsTypo,
  testExtrasInformationalWhenLenient,
  testArrayBadElementPinpoints,
  testArrayValidEmpty,
  testArrayNonArray,
  testArrayHolesPinpointed,
  testArrayBudgetFallback,
  testTupleBadMemberPinpoints,
  testTupleLengthMismatch,
  testTupleOptionalTail,
  testTupleRestVariadic,
  testTupleNonArray,
  testTaggedSnapshotSkipsMethods,
  testUntaggedStaysStrictOnMethods,
  testMismatchedTagStaysStrict,
  testSubclassTagMatches,
  testTaggedDataStillChecked,
  testDollarTypeNeverExcess,
  testNominalTagShortCircuits,
];
export {tests};
