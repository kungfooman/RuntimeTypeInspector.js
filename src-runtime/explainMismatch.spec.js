import {expandType} from '../src-transpiler/expandType.js';
import {registerTypedef, typedefs, typedefTemplates} from './registerTypedef.js';
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
const tests = [
  testMissingKey,
  testWrongNestedType,
  testGenericReferenceResolves,
  testUnionClosestMatch,
  testExtraKey,
  testPassingValueHasNoFindings,
];
export {tests};
