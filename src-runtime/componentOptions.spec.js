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
export const tests = [
  testNonNullable,
  testKeyofIntersection,
  testIndexedAccess,
  testAsRemap,
  testPartial,
  testPick,
  testOmit,
  testExtract,
];
