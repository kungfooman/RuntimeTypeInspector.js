import {validateType} from './validateType.js';
import {registerTypedef, typedefs} from './registerTypedef.js';
import {registerClass} from './registerClass.js';
import {expandType} from '../src-transpiler/expandType.js';
import {getTypeKeys} from './getTypeKeys.js';
import {createType} from './createType.js';
import {evaluateCondition, extendsCheck} from './evaluateCondition.js';
const warn = () => undefined;
/**
 * Stripped engine tower from component.js (kept JSDoc flavor). `Component`
 * and friends are real registered classes; the typedefs below exercise the
 * advanced machinery against them.
 */
class Component {}
class CameraComponent extends Component {
  constructor() {
    super();
    this.clearColor = [0, 0, 0, 1];
  }
}
class Color {
  constructor() {
    this.r = 0.5;
    this.g = 0.6;
    this.b = 0.9;
    this.a = 1;
  }
}
class CamComponent extends Component {
  constructor() {
    super();
    this.clearColor = new Color();
    this.fov = 45;
  }
}
function clearTypedefs() {
  Object.keys(typedefs).forEach((_) => delete typedefs[_]);
}
function prepare() {
  clearTypedefs();
  registerClass(Component);
  registerClass(CameraComponent);
  // Static shape used by the key machinery.
  registerTypedef('Entity', {
    type: 'object',
    properties: {
      camera: 'CameraComponent',
      name: 'string',
    },
  });
}
/**
 * Already working: NonNullable unwraps while rejecting null.
 * @returns {boolean} True when documented behavior holds.
 */
function testNonNullable() {
  prepare();
  const expect = expandType('NonNullable<CameraComponent>');
  if (!validateType(new CameraComponent(), expect, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  if (validateType(null, expect, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  return true;
}
/**
 * Already working: keyof over a typedef plus intersection with string.
 * @returns {boolean} True when documented behavior holds.
 */
function testKeyofIntersection() {
  prepare();
  const expect = expandType('keyof Entity & string');
  if (!validateType('camera', expect, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  if (validateType('nope', expect, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  return true;
}
/**
 * Already working: indexed access resolves through typedefs.
 * @returns {boolean} True when documented behavior holds.
 */
function testIndexedAccess() {
  prepare();
  const expect = expandType('Entity["camera"]');
  if (!validateType(new CameraComponent(), expect, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  if (validateType('nope', expect, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  return true;
}
/**
 * Already working: conditional key remapping (`as` clause) filters keys.
 * @returns {boolean} True when documented behavior holds.
 */
function testAsRemap() {
  prepare();
  registerTypedef('OnlyComponents', expandType('{ [K in keyof Entity as NonNullable<Entity[K]> extends Component ? K : never]: Entity[K] }'));
  const expect = expandType('keyof OnlyComponents');
  if (!validateType('camera', expect, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  if (validateType('name', expect, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  return true;
}
// Partial makes every prop optional but still checks present ones.
function testPartial() {
  prepare();
  registerTypedef('Box', {type: 'object', properties: {a: 'number', b: 'string'}});
  const expect = expandType('Partial<Box>');
  // All props optional now: empty and partial pass, wrong types still fail.
  if (!validateType({}, expect, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  if (!validateType({a: 1}, expect, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  if (validateType({a: 'x'}, expect, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  if (validateType(null, expect, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  return true;
}
// Pick keeps only the named keys, still required.
function testPick() {
  prepare();
  registerTypedef('Box', {type: 'object', properties: {a: 'number', b: 'string'}});
  const expect = expandType('Pick<Box, "a">');
  if (!validateType({a: 1}, expect, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  if (validateType({a: 'x'}, expect, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  // Picked keys stay required.
  if (validateType({}, expect, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  return true;
}
// Omit drops the named keys and keeps the rest required.
function testOmit() {
  prepare();
  registerTypedef('Box', {type: 'object', properties: {a: 'number', b: 'string'}});
  const expect = expandType('Omit<Box, "a">');
  if (!validateType({b: 'x'}, expect, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  if (validateType({b: 1}, expect, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  // Remaining keys stay required.
  if (validateType({}, expect, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  return true;
}
// Extract keeps union members assignable to the target, nothing otherwise.
function testExtract() {
  prepare();
  const expect = expandType('Extract<"a" | "b" | 1, string>');
  if (!validateType('a', expect, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  if (validateType(1, expect, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  // Empty extraction validates nothing.
  if (validateType('a', expandType('Extract<"a", number>'), 'loc', 'name', true, warn, 0)) {
    return false;
  }
  return true;
}
// IfEquals takes the A branch for identical types and B otherwise, defaulting to A=X and B=never.
function testIfEquals() {
  prepare();
  // Equal types take the A branch ('string' here).
  if (!validateType('s', expandType('IfEquals<number, number, string, boolean>'), 'loc', 'name', true, warn, 0)) {
    return false;
  }
  if (validateType(1, expandType('IfEquals<number, number, string, boolean>'), 'loc', 'name', true, warn, 0)) {
    return false;
  }
  // Unequal types take the B branch ('boolean' here).
  if (!validateType(true, expandType('IfEquals<number, string, string, boolean>'), 'loc', 'name', true, warn, 0)) {
    return false;
  }
  if (validateType('s', expandType('IfEquals<number, string, string, boolean>'), 'loc', 'name', true, warn, 0)) {
    return false;
  }
  // Defaults: A=X, B=never.
  if (!validateType(1, expandType('IfEquals<number, number>'), 'loc', 'name', true, warn, 0)) {
    return false;
  }
  if (validateType('s', expandType('IfEquals<number, string>'), 'loc', 'name', true, warn, 0)) {
    return false;
  }
  return true;
}
// WritableKeys keeps writable props and drops readonly ones.
function testWritableKeys() {
  prepare();
  registerTypedef('CCamera', expandType('{ readonly id: string, clearColor: Array<number>, enabled: boolean, update: () => void }'));
  registerTypedef('WCCamera', expandType('{ [P in keyof CCamera]-?: IfEquals<{ [Q in P]: CCamera[P] }, { -readonly [Q in P]: CCamera[P] }, P> }[keyof CCamera]'));
  for (const key of ['clearColor', 'enabled', 'update']) {
    if (!validateType(key, 'WCCamera', 'loc', 'name', true, warn, 0)) {
      return false;
    }
  }
  // Readonly props are dropped, unknown keys never matched.
  if (validateType('id', 'WCCamera', 'loc', 'name', true, warn, 0)) {
    return false;
  }
  if (validateType('nope', 'WCCamera', 'loc', 'name', true, warn, 0)) {
    return false;
  }
  return true;
}
// Generic references substitute arguments for template parameters.
function testGenericTypedefInstantiation() {
  // Generic references instantiate by substituting arguments for the
  // typedef's template parameters (harvested from `@template` lines).
  prepare();
  registerTypedef('Box', {type: 'object', properties: {content: 'T'}}, ['T']);
  if (!validateType({content: 1}, expandType('Box<number>'), 'loc', 'name', true, warn, 0)) {
    return false;
  }
  if (validateType({content: 'x'}, expandType('Box<number>'), 'loc', 'name', true, warn, 0)) {
    return false;
  }
  return true;
}
/**
 * Full engine tower with a class-typed component property (`clearColor:
 * Color`), `Partial`-based base options, system overrides and a conditional
 * data parameter. `CamEntity` also carries record, array and method members
 * like the real `Entity`/`GraphNode` pair, so the `as` remapping must drop
 * them without warnings.
 */
function prepareCameraTower() {
  clearTypedefs();
  registerClass(Component);
  registerClass(Color);
  registerClass(CamComponent);
  registerTypedef('Color', {type: 'object', properties: {r: 'number', g: 'number', b: 'number', a: 'number'}});
  registerTypedef('CamComponent', {type: 'object', properties: {clearColor: 'Color', fov: 'number'}});
  registerTypedef('CamEntity', {
    type: 'object',
    properties: {
      camera: {type: 'union', members: ['CamComponent', 'undefined'], readonly: true},
      store: {type: 'record', key: 'string', val: 'Component'},
      tags: {type: 'array', elementType: 'string'},
      name: 'string',
      addComponent: 'Function',
    },
  });
  registerTypedef('CamMap', expandType('{ [K in keyof CamEntity as NonNullable<CamEntity[K]> extends Component ? K : never]: NonNullable<CamEntity[K]> }'));
  registerTypedef('CamName', expandType('keyof CamMap & string'));
  registerTypedef('CamWritableKeys', expandType('{ [P in keyof T]-?: IfEquals<{ [Q in P]: T[P] }, { -readonly [Q in P]: T[P] }, P> }[keyof T]'), ['T']);
  registerTypedef('CamOptionKeys', expandType('{ [K in CamWritableKeys<C>]: K extends \'system\' | \'entity\' | `_${string}` ? never : NonNullable<C[K]> extends Function ? never : K }[CamWritableKeys<C>]'), ['C']); // eslint-disable-line no-template-curly-in-string
  registerTypedef('CamOptionsOf', expandType('Partial<Pick<C, Extract<CamOptionKeys<C>, keyof C>>>'), ['C']);
  registerTypedef('CamOverrides', {
    type: 'object',
    properties: {
      camera: {
        type: 'object',
        properties: {
          calculateProjection: {type: 'Function', optional: true},
          clearColor: {type: 'union', members: ['Color', {type: 'array', elementType: 'number'}], optional: true},
        },
      },
    },
  });
  registerTypedef('CamOverridesOf', expandType('K extends keyof CamOverrides ? CamOverrides[K] : {}'), ['K']);
  registerTypedef('CamMerged', expandType('Omit<CamOptionsOf<CamMap[K]>, keyof CamOverridesOf<K>> & CamOverridesOf<K>'), ['K']);
  registerTypedef('CamOptions', expandType('{ [P in keyof CamMerged<K>]: CamMerged<K>[P] }'), ['K']);
}
// `-readonly` stripping must preserve reference identity when there is no
// flag to strip: expanding `Color` to its shape broke `IfEquals` identity
// and dropped every class-typed property from `WritableKeys`.
function testWritableKeysKeepsClassProps() {
  prepareCameraTower();
  const keys = getTypeKeys(expandType('CamWritableKeys<CamComponent>'), warn);
  if (!Array.isArray(keys)) {
    return false;
  }
  if (JSON.stringify([...keys].sort()) !== JSON.stringify(['clearColor', 'fov'])) {
    return false;
  }
  return true;
}
// `NonNullable` indexed access denotes one object: its keys are the class
// keys, not the union member names (`["CamComponent", "undefined"]`).
function testNonNullableIndexedAccessKeys() {
  prepareCameraTower();
  const keys = getTypeKeys(expandType('keyof CamMap["camera"]'), warn);
  if (!Array.isArray(keys)) {
    return false;
  }
  if (JSON.stringify([...keys].sort()) !== JSON.stringify(['clearColor', 'fov'])) {
    return false;
  }
  return true;
}
// Concrete value shapes are never class instances (`instanceof` fails), so
// they decisively do not extend a class instead of staying undecidable.
function testConcreteShapesDoNotExtendClass() {
  prepareCameraTower();
  const shapes = [
    {type: 'record', key: 'string', val: 'Component'},
    {type: 'array', elementType: 'string'},
    {type: 'object', properties: {a: 'number'}},
    {type: 'function', parameters: []},
  ];
  for (const shape of shapes) {
    if (extendsCheck(shape, 'Component') !== false) {
      return false;
    }
  }
  return true;
}
// The `as` remapping keeps only component slots: record, array, method and
// primitive members are dropped without undecidable-condition warnings.
function testComponentMapDropsComplexMembers() {
  prepareCameraTower();
  let count = 0;
  const counting = () => {
    count++;
  };
  const type = createType('CamMap', counting);
  if (!type || type.type !== 'object') {
    return false;
  }
  if (JSON.stringify(Object.keys(type.properties).sort()) !== JSON.stringify(['camera'])) {
    return false;
  }
  if (count !== 0) {
    return false;
  }
  if (!validateType('camera', 'CamName', 'loc', 'name', true, warn, 0)) {
    return false;
  }
  for (const rejected of ['store', 'tags', 'name', 'addComponent', 'nope']) {
    if (validateType(rejected, 'CamName', 'loc', 'name', true, warn, 0)) {
      return false;
    }
  }
  return true;
}
// Nested utilities validate: `Partial<Pick<...>>` accepts present-correct
// and empty objects while still rejecting wrong property types.
function testNestedPartialPickValidates() {
  prepareCameraTower();
  const expect = expandType('CamOptionsOf<CamComponent>');
  if (!validateType({clearColor: new Color(), fov: 1}, expect, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  if (!validateType({}, expect, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  if (validateType({clearColor: 'x'}, expect, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  if (validateType({fov: 'x'}, expect, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  return true;
}
// End to end: the merged tower materializes every key (class-derived plus
// overrides), accepts `Color` and array forms, and rejects wrong types,
// unknown options and bad component names. The outer conditional decides.
function testMergedTowerEndToEnd() {
  prepareCameraTower();
  const keys = getTypeKeys(expandType('CamMerged<"camera">'), warn);
  if (!Array.isArray(keys) || JSON.stringify([...keys].sort()) !== JSON.stringify(['calculateProjection', 'clearColor', 'fov'])) {
    return false;
  }
  if (evaluateCondition('"camera"', typedefs.CamName, warn) !== true) {
    return false;
  }
  const expect = expandType('CamOptions<"camera">');
  const passing = [
    {clearColor: new Color()},
    {clearColor: [0.5, 0.6, 0.9, 1], fov: 60},
    {fov: 60},
    {},
  ];
  for (const value of passing) {
    if (!validateType(value, expect, 'loc', 'data', true, warn, 0)) {
      return false;
    }
  }
  const failing = [
    {clearColor: 'x'},
    {fov: 'x'},
    {nope: 1},
  ];
  for (const value of failing) {
    if (validateType(value, expect, 'loc', 'data', true, warn, 0)) {
      return false;
    }
  }
  return true;
}
export const tests = [
  testNonNullable,
  testKeyofIntersection,
  testIndexedAccess,
  testAsRemap,
  testPartial,
  testPick,
  testOmit,
  testExtract,
  testIfEquals,
  testWritableKeys,
  testGenericTypedefInstantiation,
  testWritableKeysKeepsClassProps,
  testNonNullableIndexedAccessKeys,
  testConcreteShapesDoNotExtendClass,
  testComponentMapDropsComplexMembers,
  testNestedPartialPickValidates,
  testMergedTowerEndToEnd,
];
