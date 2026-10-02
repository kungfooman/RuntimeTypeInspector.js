import {validateType} from './validateType.js';
import {classes, registerClass} from './registerClass.js';
const warn = () => undefined;
class NamedBase {
  constructor() {
    this.enabled = true;
  }
}
class NamedChild extends NamedBase {}
class NamedUnrelated {}
class NamedFloat32Array extends Float32Array {}
/**
 * Two distinct classes sharing one name: stands in for a cross-realm
 * duplicate, which shares no prototype chain with the registered class.
 * @returns {Function} A fresh class named `Ghost`.
 */
function makeGhost() {
  return class Ghost {};
}
/**
 * Registers scratch classes, runs the check, then removes them so later
 * specs observe a clean registry.
 * @param {Function} check - The assertion to run while registered.
 * @returns {boolean} The assertion result.
 */
function withNamedTargets(check) {
  registerClass(NamedBase);
  registerClass(NamedChild);
  registerClass(NamedUnrelated);
  try {
    return check();
  } finally {
    delete classes.NamedBase;
    delete classes.NamedChild;
    delete classes.NamedUnrelated;
  }
}
function testPlatformIdentityPasses() {
  // A direct platform instance passes by constructor name.
  return validateType(new Float32Array(4), 'Float32Array', 'loc', 'name', true, warn, 0) === true;
}
function testPlatformSubclassPasses() {
  // A Float32Array subclass passes via `globalThis` lookup: the `window`
  // fallback below only covers browsers, this covers workers/Node.
  return validateType(new NamedFloat32Array(4), 'Float32Array', 'loc', 'name', true, warn, 0) === true;
}
function testPlatformSiblingFails() {
  // A sibling platform type is neither an instance nor a name match.
  const warnings = [];
  const ret = validateType(new Uint8Array(4), 'Float32Array', 'loc', 'name', true, (...args) => warnings.push(args[0]), 0);
  return ret === false && warnings.includes('unchecked');
}
function testRegisteredIdentityPasses() {
  // Registered classes keep working by identity.
  return withNamedTargets(() => validateType(new NamedBase(), 'NamedBase', 'loc', 'name', true, warn, 0) === true);
}
function testRegisteredSubclassPasses() {
  // Registered classes keep accepting subclasses via `instanceof`.
  return withNamedTargets(() => validateType(new NamedChild(), 'NamedBase', 'loc', 'name', true, warn, 0) === true);
}
function testRegisteredUnrelatedFails() {
  // Registered classes still reject unrelated values.
  return withNamedTargets(() => validateType(new NamedUnrelated(), 'NamedBase', 'loc', 'name', true, warn, 0) === false);
}
function testSameNameDuplicatePasses() {
  // Same name, different identity (cross-realm stand-in): the name-equality
  // last resort accepts it even though `instanceof` cannot see it.
  const Ghost = makeGhost();
  registerClass(Ghost);
  try {
    return validateType(new (makeGhost())(), 'Ghost', 'loc', 'name', true, warn, 0) === true;
  } finally {
    delete classes.Ghost;
  }
}
function testUnknownNameFailsClosed() {
  // Unknown names fail closed with `unchecked` for diagnosis.
  const warnings = [];
  const ret = validateType({}, 'NoSuchNamedType', 'loc', 'name', true, (...args) => warnings.push(args[0]), 0);
  return ret === false && warnings.includes('unchecked');
}
const tests = [
  testPlatformIdentityPasses,
  testPlatformSubclassPasses,
  testPlatformSiblingFails,
  testRegisteredIdentityPasses,
  testRegisteredSubclassPasses,
  testRegisteredUnrelatedFails,
  testSameNameDuplicatePasses,
  testUnknownNameFailsClosed,
];
export {tests};
