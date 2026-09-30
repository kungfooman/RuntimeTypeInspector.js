import {expandType} from '../src-transpiler/expandType.js';
import {describeValueType, formatMapKey, prettyValue} from './describeValue.js';
import {inspectType} from './inspectType.js';
import {diffValue, snip} from './explainMismatch.js';
import {buildTypeTree} from './typeTree.js';
import {formatCompare} from './humanizeExpect.js';
import {captureMessages, dump, warningFor} from '../src-unittest/index.js';
/**
 * The 12-entry shader map from issue #267.
 * @returns {Map} The fixture map.
 */
function shaderMap() {
  return new Map([
    ['UV_SET_COUNT', 0],
    ['UV_VARYING_SET_COUNT', 0],
    ['UV_TRANSFORMS_COUNT', 0],
    ['SCENE_COLORMAP_GAMMA', ''],
    ['FOG', 'NONE'],
    ['TONEMAP', undefined],
    ['GAMMA', 'SRGB'],
    ['PERSPECTIVE_DEPTH', ''],
    ['LIGHT_TYPE', 'SPOT'],
    ['SHADOW_TYPE', 'PCF3_32F'],
    ['SHADOW_PASS', ''],
    ['SHADOWPASS_2_0_PASS', ''],
  ]);
}
/**
 * The `Map<string, string | number>` mismatch from the follow-up report.
 * @returns {{mapExpect: object, bad: Map}} Fixture.
 */
function apiKeyMismatch() {
  return {mapExpect: expandType('Map<string, string | number>'), bad: new Map([['apiKey', null]])};
}
function testMapShowsInferredGenerics() {
  return describeValueType(new Map([['a', 1], ['b', 'x']])) === 'Map<string, number | string>';
}
function testMapIssueExample() {
  // Literals widen (like `new Map()` inference): compact one-liner.
  return describeValueType(shaderMap()) === 'Map<string, number | string | undefined>';
}
function testEmptyMap() {
  return describeValueType(new Map()) === 'Map<never, never>';
}
function testMapUnionBounded() {
  // 1000 distinct value types collapse to a capped union, not 1kb+ of text.
  const big = new Map(Array.from({length: 1000}, (_, i) => [`k${i}`, BigInt(i)]));
  const text = describeValueType(big);
  return text.length < 100 && text.startsWith('Map<string, 0n | 1n') && text.includes('| ...>');
}
function testMapDepthZeroKeepsTag() {
  // Depth-exhausted maps keep at least the `Map` tag, never `object`.
  return describeValueType(shaderMap(), 0) === 'Map';
}
function testSetShowsInferredGenerics() {
  return describeValueType(new Set([1, 'a'])) === 'Set<number | string>';
}
function testSetUnionBounded() {
  const many = new Set(Array.from({length: 30}, (_, i) => ({i})));
  const text = describeValueType(many);
  return text.startsWith('Set<{i: 0}') && text.includes('| ...>') && text.length < 300;
}
function testEmptySet() {
  return describeValueType(new Set()) === 'Set<never>';
}
function testPlainValuesUnaffected() {
  return describeValueType({a: 1}) === '{a: 1}' &&
    describeValueType([1, 2]) === '[1, 2]' &&
    describeValueType('x') === '"x"';
}
function testNestedMapInObject() {
  const text = describeValueType({m: new Map([['a', 1]])});
  return text === '{m: Map<string, number>}';
}
function testFormatMapKey() {
  return formatMapKey('apiKey') === "'apiKey'" &&
    formatMapKey("a'b") === "'a\\'b'" &&
    formatMapKey(1) === '1' &&
    formatMapKey(null) === 'null';
}
function testInspectSummaryShowsMap() {
  // End to end: the `Argument of type …` summary reads TS-style instead of
  // `Map(1){"apiKey" => null}` or `Map {}`.
  const msgs = captureMessages(() => {
    inspectType(new Map([['apiKey', null]]), 'number', 'loc', 'name');
  });
  if (msgs.length !== 1) {
    return false;
  }
  const [summary] = msgs[0].strings;
  return summary.includes('Map<string, null>') &&
    !summary.includes('=>') && !summary.includes('Map {}');
}
function testSnipMapPretty() {
  // Diagnosis `got` cells: no more `{"$type": "Map", …}` JSON.
  return snip(new Map([['apiKey', null]])) === 'Map<string, null>' &&
    snip(new Set([1])) === 'Set<number>';
}
function testSnipPlainUnaffected() {
  return snip({a: 1}) === '{"a":1}' && snip('x') === '"x"';
}
function testDiffMapPinpointsEntry() {
  const {mapExpect, bad} = apiKeyMismatch();
  const findings = diffValue(bad, mapExpect, 'config', 0);
  if (findings.length !== 1) {
    return false;
  }
  // The entry value misses a union member, so the pinpoint is a union
  // finding naming the closest member's problem as its child.
  const [finding] = findings;
  return finding.kind === 'union' &&
    finding.path === "config.get('apiKey')" &&
    finding.expected === 'string | number' &&
    finding.actual === 'null' &&
    finding.children.length === 1 &&
    finding.children[0].path === "config.get('apiKey')" &&
    finding.children[0].fix.includes("config.get('apiKey')");
}
function testDiffMapPasses() {
  const {mapExpect} = apiKeyMismatch();
  return diffValue(new Map([['a', 'x'], ['b', 1]]), mapExpect, 'config', 0).length === 0;
}
function testDiffMapNotAMap() {
  const {mapExpect} = apiKeyMismatch();
  const findings = diffValue({a: 1}, mapExpect, 'config', 0);
  return findings.length === 1 && findings[0].kind === 'wrong' &&
    findings[0].detail.includes('Expected a Map');
}
function testDiffMapInsideUnion() {
  // The reported shape: a union member mismatch keeps the entry pinpoint
  // as the closest-match child instead of one opaque row.
  const {bad} = apiKeyMismatch();
  const unionExpect = expandType('Map<string, string> | number');
  const findings = diffValue(bad, unionExpect, 'config', 0);
  const union = findings.find((_) => _.kind === 'union');
  return !!union && union.children.length === 1 &&
    union.children[0].path === "config.get('apiKey')" &&
    union.children[0].actual === 'null';
}
function testDiffSetPinpointsMember() {
  const findings = diffValue(new Set([1, 'x']), expandType('Set<number>'), 'tags', 0);
  return findings.length === 1 && findings[0].path === 'tags[1]' &&
    findings[0].expected === 'number' && findings[0].actual === '"x"';
}
function testDiffSetNotASet() {
  const findings = diffValue([1], expandType('Set<number>'), 'tags', 0);
  return findings.length === 1 && findings[0].detail.includes('Expected a Set');
}
function testTypeTreeMap() {
  const {mapExpect, bad} = apiKeyMismatch();
  const tree = buildTypeTree(mapExpect, bad, 'config', undefined, 'config');
  if (tree.kind !== 'map' || tree.passes !== false || tree.children?.length !== 1) {
    return false;
  }
  const [child] = tree.children;
  return child.passes === false && child.label.includes("get('apiKey')") &&
    child.path === "config.get('apiKey')";
}
function testTypeTreeMapNotAMap() {
  const {mapExpect} = apiKeyMismatch();
  const tree = buildTypeTree(mapExpect, {a: 1}, 'config', undefined, 'config');
  return tree.kind === 'map' && tree.passes === false &&
    !tree.children && tree.detail.includes('not a Map');
}
function testTypeTreeSet() {
  const tree = buildTypeTree(expandType('Set<number>'), new Set([1, 'x']), 'tags', undefined, 'tags');
  if (tree.kind !== 'set' || tree.children?.length !== 2) {
    return false;
  }
  return tree.children[0].passes === true && tree.children[1].passes === false &&
    tree.children[1].path === 'tags[1]';
}
function testFormatComparePretty() {
  const {mapExpect, bad} = apiKeyMismatch();
  const {expectPretty, actualPretty} = formatCompare(mapExpect, bad);
  return expectPretty.includes('Map<string, string | number>') &&
    actualPretty.includes('Map(1) {') &&
    actualPretty.includes('"apiKey" => null') &&
    !actualPretty.includes('$type');
}
function testFormatComparePlainUnaffected() {
  const {actualPretty} = formatCompare('number', {a: 1});
  return actualPretty.includes('"a"');
}
function testPrettyValueShapes() {
  return prettyValue(new Map()) === 'Map(0) {}' &&
    prettyValue(new Set()) === 'Set(0) {}' &&
    prettyValue({a: 1}) === undefined &&
    prettyValue(new Set(['a', 'b'])) === 'Set(2) {\n  "a"\n  "b"\n}';
}
function testPrettyValueBounded() {
  const text = prettyValue(new Map(Array.from({length: 30}, (_, i) => [`k${i}`, i])));
  return text.includes('Map(30) {') && text.includes('...(+10 more)') && !text.includes('k29');
}
function testWarningMapCell() {
  const {warn, restore} = warningFor(new Map([['FOG', 'NONE'], ['GAMMA', 'SRGB']]));
  try {
    const text = dump(warn.td_value);
    const [tree] = warn.td_value.children;
    return text.includes('Map(2)') && text.includes('FOG') && text.includes('NONE') &&
      !text.includes('[object Map]') && tree?.open === true;
  } finally {
    restore();
  }
}
function testWarningMapCellBounded() {
  const {warn, restore} = warningFor(new Map(Array.from({length: 30}, (_, i) => [`k${i}`, i])));
  try {
    const text = dump(warn.td_value);
    // 20 entry rows plus the summary plus the `...(+N more)` marker.
    const rows = warn.td_value.children[0]?.children ?? [];
    return text.includes('Map(30)') && text.includes('...(+10 more)') &&
      rows.length === 22 && !text.includes('k29');
  } finally {
    restore();
  }
}
function testWarningSetCell() {
  const {warn, restore} = warningFor(new Set(['a', 'b']));
  try {
    const text = dump(warn.td_value);
    const [tree] = warn.td_value.children;
    return text.includes('Set(2)') && text.includes('a') &&
      !text.includes('[object Set]') && tree?.open === true;
  } finally {
    restore();
  }
}
function testWarningNestedMap() {
  // A map nested in a plain object reads as generics, never `[object Map]`.
  const {warn, restore} = warningFor({m: new Map([['a', 1]])});
  try {
    const text = dump(warn.td_value);
    return !text.includes('[object Map]') && text.includes('Map<string, number>');
  } finally {
    restore();
  }
}
function testWarningPlainUnaffected() {
  const {warn, restore} = warningFor({a: 1});
  try {
    const text = dump(warn.td_value);
    return text.includes('a') && text.includes('1') && !text.includes('Map(');
  } finally {
    restore();
  }
}
function testWarningValueRefreshFollowsLatest() {
  // Rows absorb repeat hits: a later plain value replaces the map tree.
  const {warn, restore} = warningFor(shaderMap());
  try {
    if (!dump(warn.td_value).includes('Map(12)')) {
      return false;
    }
    warn.value = {a: 1};
    const text = dump(warn.td_value);
    return !text.includes('Map(12)') && text.includes('a');
  } finally {
    restore();
  }
}
const tests = [
  testMapShowsInferredGenerics,
  testMapIssueExample,
  testEmptyMap,
  testMapUnionBounded,
  testMapDepthZeroKeepsTag,
  testSetShowsInferredGenerics,
  testSetUnionBounded,
  testEmptySet,
  testPlainValuesUnaffected,
  testNestedMapInObject,
  testFormatMapKey,
  testInspectSummaryShowsMap,
  testSnipMapPretty,
  testSnipPlainUnaffected,
  testDiffMapPinpointsEntry,
  testDiffMapPasses,
  testDiffMapNotAMap,
  testDiffMapInsideUnion,
  testDiffSetPinpointsMember,
  testDiffSetNotASet,
  testTypeTreeMap,
  testTypeTreeMapNotAMap,
  testTypeTreeSet,
  testFormatComparePretty,
  testFormatComparePlainUnaffected,
  testPrettyValueShapes,
  testPrettyValueBounded,
  testWarningMapCell,
  testWarningMapCellBounded,
  testWarningSetCell,
  testWarningNestedMap,
  testWarningPlainUnaffected,
  testWarningValueRefreshFollowsLatest,
];
export {tests};
