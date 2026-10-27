import {materializeUtility} from './materializeUtility.js';
import {deepEqualType} from './deepEqualType.js';
import {expandType} from '../src-transpiler/expandType.js';
const silent = () => undefined;
// We want: Pick to keep only the named props, because indexed access over
// `Pick<T, K>` reads the picked shape.
function testPickKeepsNamed() {
  const parsed = expandType('Pick<{a: K, b: number}, "a">');
  const materialized = materializeUtility(parsed, silent, 0);
  const expected = {type: 'object', properties: {a: 'K'}};
  return deepEqualType(materialized, expected);
}
// We want: Omit to drop the named props, because indexed access over
// `Omit<T, K>` reads everything except the dropped keys.
function testOmitDropsNamed() {
  const parsed = expandType('Omit<{a: K, b: number}, "a">');
  const materialized = materializeUtility(parsed, silent, 0);
  const expected = {type: 'object', properties: {b: 'number'}};
  return deepEqualType(materialized, expected);
}
// We want: Partial to mark every prop optional, because indexed access over
// `Partial<T>` reads the optionalized shape.
function testPartialMarksOptional() {
  const parsed = expandType('Partial<{a: K}>');
  const materialized = materializeUtility(parsed, silent, 0);
  const expected = {type: 'object', properties: {a: {type: 'K', optional: true}}};
  return deepEqualType(materialized, expected);
}
// We want: unresolvable bases to yield undefined, because callers fail
// closed instead of validating against a guessed shape.
function testUnresolvableYieldsUndefined() {
  const parsed = expandType('Pick<Missing, "a">');
  return materializeUtility(parsed, silent, 0) === undefined;
}
// We want: missing args to yield undefined, because a malformed utility
// reference carries no base or key list to materialize from.
function testMissingArgsYieldsUndefined() {
  return materializeUtility({type: 'reference', name: 'Pick', args: []}, silent, 0) === undefined;
}
const tests = [
  testPickKeepsNamed,
  testOmitDropsNamed,
  testPartialMarksOptional,
  testUnresolvableYieldsUndefined,
  testMissingArgsYieldsUndefined,
];
export {tests};
