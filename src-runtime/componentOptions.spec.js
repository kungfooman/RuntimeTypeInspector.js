import {validateType} from './validateType.js';
import {registerTypedef, typedefs} from './registerTypedef.js';
import {registerClass} from './registerClass.js';
import {expandType} from '../src-transpiler/expandType.js';
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
];
