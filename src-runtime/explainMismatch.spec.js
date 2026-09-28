import {expandType} from '../src-transpiler/expandType.js';
import {registerTypedef, typedefs, typedefTemplates} from './registerTypedef.js';
import {registerClass, classes} from './registerClass.js';
import {options} from './options.js';
import {explainMismatch, materializeExpect} from './explainMismatch.js';
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
const tests = [
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
];
export {tests};
