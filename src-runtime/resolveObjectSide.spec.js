import {resolveObjectSide} from './resolveObjectSide.js';
import {deepEqualType} from './deepEqualType.js';
import {expandType} from '../src-transpiler/expandType.js';
const silent = () => undefined;
// We want: plain object shapes to pass through, because indexed access
// reads their properties directly.
function testObjectPassthrough() {
  const parsed = expandType('{a: K}');
  const input = parsed;
  const resolved = resolveObjectSide(input, silent, 0);
  return deepEqualType(resolved, {type: 'object', properties: {a: 'K'}});
}
// We want: utility references to materialize, because `T[K]` over
// `Pick<T, ...>` reads the picked shape, not the reference.
function testUtilityMaterializes() {
  const parsed = expandType('Pick<{a: K, b: number}, "a">');
  const resolved = resolveObjectSide(parsed, silent, 0);
  const expected = {type: 'object', properties: {a: 'K'}};
  return deepEqualType(resolved, expected);
}
// We want: intersections to merge member shapes, because `T[K]` over
// `(A & B)` reads from both sides.
function testIntersectionMerges() {
  const parsed = expandType('{a: K} & {b: number}');
  const resolved = resolveObjectSide(parsed, silent, 0);
  const expected = {type: 'object', properties: {a: 'K', b: 'number'}};
  return deepEqualType(resolved, expected);
}
// We want: an unresolvable member to fail the whole merge, because a
// partial property map would silently drop keys instead of failing closed.
function testUnresolvableMemberFailsMerge() {
  const parsed = expandType('{a: K} & Missing');
  return resolveObjectSide(parsed, silent, 0) === undefined;
}
// We want: depth overflow to stop, because cyclic typedefs must not hang
// the resolver.
function testDepthOverflowStops() {
  return resolveObjectSide(expandType('{a: K}'), silent, 11) === undefined;
}
const tests = [
  testObjectPassthrough,
  testUtilityMaterializes,
  testIntersectionMerges,
  testUnresolvableMemberFailsMerge,
  testDepthOverflowStops,
];
export {tests};
