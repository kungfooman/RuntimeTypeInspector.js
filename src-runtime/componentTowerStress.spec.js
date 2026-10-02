import {validateType} from './validateType.js';
import {registerTypedef, typedefs} from './registerTypedef.js';
import {registerClass} from './registerClass.js';
import {expandType} from '../src-transpiler/expandType.js';
import {getTypeKeys, resolveObject} from './getTypeKeys.js';
import {createType} from './createType.js';
import {extendsCheck} from './evaluateCondition.js';
import {createTypeFromMapping} from './createTypeFromMapping.js';
const warn = () => undefined;
/**
 * Stress coverage for the conditional-tower fixes: modifier identity
 * (`-?`/`-readonly` must not expand references), `NonNullable` key reads,
 * nested utility validation, and concrete-shape-vs-class decisions.
 * Names are `Tw`-prefixed so the shared registries never collide with the
 * `componentMap`/`componentOptions` suites. Every test rebuilds its own
 * state; assertions are structural (keys, booleans, warning counts), never
 * human-readable prose.
 */
class TwComponent {}
class TwColor extends TwComponent {
  constructor() {
    super();
    this.r = 1;
  }
}
class TwCam extends TwComponent {
  constructor() {
    super();
    this.fov = 45;
  }
}
class TwOther {}
function clearTypedefs() {
  Object.keys(typedefs).forEach((_) => delete typedefs[_]);
}
function prepareStress() {
  clearTypedefs();
  registerClass(TwComponent);
  registerClass(TwColor);
  registerClass(TwCam);
  registerClass(TwOther);
  registerTypedef('TwColor', {type: 'object', properties: {r: 'number'}});
  registerTypedef('TwCam', {type: 'object', properties: {fov: 'number'}});
  registerTypedef('TwBox', {type: 'object', properties: {a: 'number', b: 'string'}});
  registerTypedef('TwBox2', {type: 'object', properties: {a: 'number', c: 'boolean'}});
  registerTypedef('TwTint', 'TwColor');
  registerTypedef('TwChain', 'TwTint');
  registerTypedef('TwOptBox', {type: 'object', properties: {v: 'number'}, optional: true});
  registerTypedef('TwRoBox', {type: 'object', properties: {v: 'number'}, readonly: true});
  registerTypedef('TwRich', {
    type: 'object',
    properties: {
      plain: 'TwColor',
      alias: 'TwTint',
      chain: 'TwChain',
      union: {type: 'union', members: ['TwColor', {type: 'array', elementType: 'number'}]},
      list: {type: 'array', elementType: 'TwColor'},
      count: 'number',
    },
  });
  registerTypedef('TwWritable', expandType('{ [P in keyof T]-?: IfEquals<{ [Q in P]: T[P] }, { -readonly [Q in P]: T[P] }, P> }[keyof T]'), ['T']);
}
// --- Point 1: `-?` / `-readonly` preserve reference identity. ---
// Stripping over aliases keeps the original spelling on both sides.
function testStripKeepsAliasSpelling() {
  prepareStress();
  const stripped = createTypeFromMapping(expandType('{ [K in "x"]-?: TwTint }'), warn);
  if (stripped.properties.x !== 'TwTint') {
    return false;
  }
  const unreadonly = createTypeFromMapping(expandType('{ -readonly [K in "x"]: TwChain }'), warn);
  if (unreadonly.properties.x !== 'TwChain') {
    return false;
  }
  return true;
}
// A genuinely optional target is still stripped, and the registry clone is
// never mutated by the strip.
function testStripQuestionStillStrips() {
  prepareStress();
  const stripped = createTypeFromMapping(expandType('{ [K in "x"]-?: TwOptBox }'), warn);
  const prop = stripped.properties.x;
  if (!prop || typeof prop !== 'object' || prop.optional) {
    return false;
  }
  if (typedefs.TwOptBox.optional !== true) {
    return false;
  }
  if (validateType(undefined, prop, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  if (!validateType({v: 1}, prop, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  return true;
}
// A genuinely readonly target is still stripped, while the plain mapping
// keeps the reference spelling (and the registry keeps its flag).
function testStripReadonlyStillStrips() {
  prepareStress();
  const stripped = createTypeFromMapping(expandType('{ -readonly [K in "x"]: TwRoBox }'), warn);
  const prop = stripped.properties.x;
  if (!prop || typeof prop !== 'object' || prop.readonly || prop.properties === undefined) {
    return false;
  }
  if (typedefs.TwRoBox.readonly !== true) {
    return false;
  }
  const plain = createTypeFromMapping(expandType('{ [K in "x"]: TwRoBox }'), warn);
  if (plain.properties.x !== 'TwRoBox') {
    return false;
  }
  return true;
}
// `+?` still forces optionality on reference spellings.
function testForceQuestionOnClassRef() {
  prepareStress();
  const forced = createTypeFromMapping(expandType('{ [K in "x"]+?: TwColor }'), warn);
  const prop = forced.properties.x;
  if (!prop || typeof prop !== 'object' || prop.optional !== true) {
    return false;
  }
  if (!validateType(undefined, prop, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  return true;
}
// Every value spelling survives `WritableKeys`: plain, alias, chained
// alias, union, array-of-class and primitive.
function testWritableKeysRichSpelling() {
  prepareStress();
  const keys = getTypeKeys(expandType('TwWritable<TwRich>'), warn);
  if (!Array.isArray(keys)) {
    return false;
  }
  const want = ['alias', 'chain', 'count', 'list', 'plain', 'union'];
  if (JSON.stringify([...keys].sort()) !== JSON.stringify(want)) {
    return false;
  }
  return true;
}
// Getter-only (readonly) properties are still filtered out.
function testWritableKeysDropsGetterOnly() {
  prepareStress();
  registerTypedef('TwMixed', {
    type: 'object',
    properties: {
      ro: {type: 'TwColor', readonly: true},
      rw: 'TwColor',
    },
  });
  const keys = getTypeKeys(expandType('TwWritable<TwMixed>'), warn);
  if (!Array.isArray(keys) || JSON.stringify(keys) !== JSON.stringify(['rw'])) {
    return false;
  }
  return true;
}
// --- Point 2: `NonNullable` key reads and single-member unions. ---
// `keyof NonNullable<Box | undefined>` is the class keys, not member names.
function testNonNullableDirectKeys() {
  prepareStress();
  const keys = getTypeKeys(expandType('keyof NonNullable<TwBox|undefined>'), warn);
  if (!Array.isArray(keys) || JSON.stringify([...keys].sort()) !== JSON.stringify(['a', 'b'])) {
    return false;
  }
  return true;
}
// Doubly wrapped nullish unions still resolve to the object keys.
function testDoubleNonNullableKeys() {
  prepareStress();
  const keys = getTypeKeys(expandType('NonNullable<NonNullable<TwBox|undefined>|null>'), warn);
  if (!Array.isArray(keys) || JSON.stringify([...keys].sort()) !== JSON.stringify(['a', 'b'])) {
    return false;
  }
  return true;
}
// A lone object beside nullish members resolves; anything wider or
// emptier stays unresolvable rather than guessing.
function testSingleMemberUnionResolution() {
  prepareStress();
  const single = resolveObject({type: 'union', members: ['TwBox', 'undefined']}, warn, 0);
  if (!single || single.type !== 'object' || JSON.stringify(Object.keys(single.properties).sort()) !== JSON.stringify(['a', 'b'])) {
    return false;
  }
  if (resolveObject({type: 'union', members: ['TwBox', 'TwBox2']}, warn, 0) !== undefined) {
    return false;
  }
  if (resolveObject({type: 'union', members: ['null', 'undefined']}, warn, 0) !== undefined) {
    return false;
  }
  return true;
}
// `| null` slots (not just `| undefined`) participate in the map, and
// key reads resolve through them instead of returning member names.
function testNullSlotJoinsMap() {
  prepareStress();
  registerTypedef('TwNullEntity', {
    type: 'object',
    properties: {
      camera: {type: 'union', members: ['TwCam', 'null']},
      name: 'string',
    },
  });
  registerTypedef('TwNullMap', expandType('{ [K in keyof TwNullEntity as NonNullable<TwNullEntity[K]> extends TwComponent ? K : never]: NonNullable<TwNullEntity[K]> }'));
  let count = 0;
  const type = createType('TwNullMap', () => {
    count++;
  });
  if (!type || JSON.stringify(Object.keys(type.properties)) !== JSON.stringify(['camera'])) {
    return false;
  }
  if (count !== 0) {
    return false;
  }
  const keys = getTypeKeys(expandType('keyof TwNullMap["camera"]'), warn);
  if (!Array.isArray(keys) || JSON.stringify(keys) !== JSON.stringify(['fov'])) {
    return false;
  }
  return true;
}
// --- Point 3: nested utility validation. ---
// Doubly nested `Partial` stays fully optional but still type-checks.
function testDoublyNestedPartial() {
  prepareStress();
  const expect = expandType('Partial<Partial<TwBox>>');
  if (!validateType({}, expect, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  if (!validateType({a: 1}, expect, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  if (validateType({a: 'x'}, expect, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  return true;
}
// `Required` re-imposes what `Partial` lifted.
function testRequiredReimposes() {
  prepareStress();
  const expect = expandType('Required<Partial<TwBox>>');
  if (validateType({}, expect, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  if (!validateType({a: 1, b: 's'}, expect, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  return true;
}
// A generic typedef wrapping a utility instantiates before materializing.
function testGenericUtilityWrapper() {
  prepareStress();
  registerTypedef('TwOpts', expandType('Partial<Pick<T, "a">>'), ['T']);
  if (!validateType({a: 1}, expandType('TwOpts<TwBox>'), 'loc', 'name', true, warn, 0)) {
    return false;
  }
  if (!validateType({}, expandType('TwOpts<TwBox>'), 'loc', 'name', true, warn, 0)) {
    return false;
  }
  if (validateType({a: 'x'}, expandType('TwOpts<TwBox>'), 'loc', 'name', true, warn, 0)) {
    return false;
  }
  return true;
}
// Utilities distribute over unions member-wise instead of merging.
function testUtilityUnionDistribution() {
  prepareStress();
  const expect = expandType('Partial<TwBox|TwBox2>');
  if (!validateType({b: 's'}, expect, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  if (!validateType({c: true}, expect, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  if (validateType({a: 'x', c: 'x'}, expect, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  const keys = getTypeKeys(expandType('Omit<Partial<TwBox>, "a">'), warn);
  if (!Array.isArray(keys) || JSON.stringify(keys) !== JSON.stringify(['b'])) {
    return false;
  }
  // `Omit` over a nested union utility validates member-wise: omitted keys
  // are rejected while surviving keys still type-check.
  const omitUnion = expandType('Omit<Partial<TwBox|TwBox2>, "a">');
  if (!validateType({b: 's'}, omitUnion, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  if (!validateType({c: true}, omitUnion, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  if (validateType({a: 1}, omitUnion, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  if (validateType({b: 1}, omitUnion, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  return true;
}
// `NonNullable` unwraps before utility materialization, for validation
// and for key reads alike.
function testNonNullableUtility() {
  prepareStress();
  const expect = expandType('NonNullable<Partial<TwBox>|undefined>');
  if (!validateType({a: 1}, expect, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  if (validateType(null, expect, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  if (validateType({a: 'x'}, expect, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  const keys = getTypeKeys(expandType('NonNullable<Partial<TwBox>|undefined>'), warn);
  if (!Array.isArray(keys) || JSON.stringify([...keys].sort()) !== JSON.stringify(['a', 'b'])) {
    return false;
  }
  return true;
}
// --- Point 4: concrete shapes never extend a class; deferred stays open. ---
// Every concrete value shape decisively rejects a class target.
function testEachConcreteKindDecisive() {
  prepareStress();
  const shapes = [
    {type: 'object', properties: {a: 'number'}},
    {type: 'object'},
    {type: 'array', elementType: 'string'},
    {type: 'tuple', elements: ['string', 'number']},
    {type: 'record', key: 'string', val: 'number'},
    {type: 'map', key: 'string', val: 'number'},
    {type: 'set', elementType: 'number'},
    {type: 'promise', elementType: 'number'},
    {type: 'function', parameters: []},
    {type: 'new', parameters: []},
    expandType('`_${string}`'), // eslint-disable-line no-template-curly-in-string
    expandType('Array<number>'),
    expandType('ReadonlyArray<number>'),
  ];
  for (const shape of shapes) {
    if (extendsCheck(shape, 'TwComponent') !== false) {
      return false;
    }
  }
  return true;
}
// Unresolvable forms stay undecidable instead of failing closed.
function testDeferredStaysUndecidable() {
  prepareStress();
  if (extendsCheck(expandType('TwBoxed<number>'), 'TwComponent') !== undefined) {
    return false;
  }
  if (extendsCheck({type: 'keyof', argument: 'TwMissing'}, 'TwComponent') !== undefined) {
    return false;
  }
  if (extendsCheck({type: 'condition', checkType: 'TwBox', extendsType: 'TwComponent', trueType: '"a"', falseType: '"b"'}, 'TwComponent') !== undefined) {
    return false;
  }
  return true;
}
// Union checks fail fast on a decisive member, even beside deferred ones.
function testUnionMixShortCircuits() {
  prepareStress();
  const mixed = {type: 'union', members: [{type: 'array', elementType: 'string'}, expandType('TwBoxed<number>')]};
  if (extendsCheck(mixed, 'TwComponent') !== false) {
    return false;
  }
  return true;
}
// Nominal identity is intact: subclasses hold, parents and strangers fail.
function testNominalChainIntact() {
  prepareStress();
  if (extendsCheck('TwCam', 'TwComponent') !== true) {
    return false;
  }
  if (extendsCheck('TwComponent', 'TwCam') !== false) {
    return false;
  }
  if (extendsCheck('TwOther', 'TwComponent') !== false) {
    return false;
  }
  return true;
}
// A noisy entity (tuple, promise, map, readonly array, function, record,
// nested shapes, methods, primitives) maps to its slots with zero warnings.
function testBigMapSilent() {
  prepareStress();
  registerTypedef('TwBig', {
    type: 'object',
    properties: {
      camera: {type: 'union', members: ['TwCam', 'undefined']},
      tup: {type: 'tuple', elements: ['string', 'number']},
      prom: {type: 'promise', elementType: 'number'},
      grid: {type: 'map', key: 'string', val: 'number'},
      tags: expandType('ReadonlyArray<string>'),
      run: 'Function',
      rec: {type: 'record', key: 'string', val: 'number'},
      nested: {type: 'object', properties: {deep: {type: 'array', elementType: {type: 'tuple', elements: ['number']}}}},
      name: 'string',
      addComponent: 'Function',
    },
  });
  registerTypedef('TwBigMap', expandType('{ [K in keyof TwBig as NonNullable<TwBig[K]> extends TwComponent ? K : never]: NonNullable<TwBig[K]> }'));
  let count = 0;
  const type = createType('TwBigMap', () => {
    count++;
  });
  if (!type || JSON.stringify(Object.keys(type.properties)) !== JSON.stringify(['camera'])) {
    return false;
  }
  return count === 0;
}
// Static decisions agree with runtime checks: plain data is never a class
// instance, while real instances pass both layers.
function testStaticRuntimeAgreement() {
  prepareStress();
  if (validateType({r: 1}, 'TwColor', 'loc', 'name', true, warn, 0)) {
    return false;
  }
  if (validateType([1], 'TwColor', 'loc', 'name', true, warn, 0)) {
    return false;
  }
  if (!validateType(new TwColor(), 'TwColor', 'loc', 'name', true, warn, 0)) {
    return false;
  }
  if (extendsCheck({type: 'object', properties: {r: 'number'}}, 'TwColor') !== false) {
    return false;
  }
  return true;
}
export const tests = [
  testStripKeepsAliasSpelling,
  testStripQuestionStillStrips,
  testStripReadonlyStillStrips,
  testForceQuestionOnClassRef,
  testWritableKeysRichSpelling,
  testWritableKeysDropsGetterOnly,
  testNonNullableDirectKeys,
  testDoubleNonNullableKeys,
  testSingleMemberUnionResolution,
  testNullSlotJoinsMap,
  testDoublyNestedPartial,
  testRequiredReimposes,
  testGenericUtilityWrapper,
  testUtilityUnionDistribution,
  testNonNullableUtility,
  testEachConcreteKindDecisive,
  testDeferredStaysUndecidable,
  testUnionMixShortCircuits,
  testNominalChainIntact,
  testBigMapSilent,
  testStaticRuntimeAgreement,
];
