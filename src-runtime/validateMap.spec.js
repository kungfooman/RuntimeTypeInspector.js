import {validateType} from './validateType.js';
import {classes, registerClass} from './registerClass.js';
import {registerTypedef} from './registerTypedef.js';
import {expandType} from '../src-transpiler/expandType.js';
const warn = () => undefined;
class MapKeyBase {
  constructor() {
    this.enabled = true;
  }
}
class MapKeyChild extends MapKeyBase {}
class MapKeyOther {
  constructor() {
    this.label = 'x';
  }
}
/**
 * Registers scratch classes, runs the check, then removes them so later
 * specs observe a clean registry.
 * @param {Function} check - The assertion to run while registered.
 * @returns {boolean} The assertion result.
 */
function withMapKeys(check) {
  registerClass(MapKeyBase);
  registerClass(MapKeyChild);
  registerClass(MapKeyOther);
  try {
    return check();
  } finally {
    delete classes.MapKeyBase;
    delete classes.MapKeyChild;
    delete classes.MapKeyOther;
  }
}
function testStringKeysStillWork() {
  // String-keyed maps keep their behavior, values included.
  const expect = expandType('Map<string, number>');
  if (!validateType(new Map([['a', 1]]), expect, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  return validateType(new Map([['a', 'x']]), expect, 'loc', 'name', true, warn, 0) === false;
}
function testNumberKeysPass() {
  // `Map<number, string>` accepts numeric keys (the gsplat case).
  const expect = expandType('Map<number, string>');
  return validateType(new Map([[1, 'a'], [2, 'b']]), expect, 'loc', 'name', true, warn, 0) === true;
}
function testNumberKeysRejectStrings() {
  // `Map<number, string>` rejects string keys with a keyed diagnosis.
  const expect = expandType('Map<number, string>');
  const warnings = [];
  const infos = [];
  const ret = validateType(new Map([['1', 'a']]), expect, 'loc', 'name', true, (...args) => {
    warnings.push(args[0]);
    infos.push(args[1]);
  }, 0);
  return ret === false && warnings.some((_) => typeof _ === 'string' && _.includes('Map key')) &&
    infos.some((info) => info && info.expect === 'number' && info.value === '1');
}
function testClassKeysPass() {
  // Class-keyed maps accept instances, subclasses included.
  return withMapKeys(() => {
    const expect = expandType('Map<MapKeyBase, number>');
    return validateType(new Map([[new MapKeyBase(), 1]]), expect, 'loc', 'name', true, warn, 0) === true &&
      validateType(new Map([[new MapKeyChild(), 1]]), expect, 'loc', 'name', true, warn, 0) === true;
  });
}
function testClassKeysRejectOthers() {
  // Class-keyed maps reject instances of other classes.
  return withMapKeys(() => {
    const expect = expandType('Map<MapKeyBase, number>');
    return validateType(new Map([[new MapKeyOther(), 1]]), expect, 'loc', 'name', true, warn, 0) === false;
  });
}
function testNonMapFails() {
  // Non-Map values fail whatever the key type.
  const expect = expandType('Map<number, string>');
  return validateType({}, expect, 'loc', 'name', true, warn, 0) === false &&
    validateType([[1, 'a']], expect, 'loc', 'name', true, warn, 0) === false;
}
function testEmptyMapPasses() {
  // Vacously true for every key/value combination.
  return validateType(new Map(), expandType('Map<number, string>'), 'loc', 'name', true, warn, 0) === true &&
    validateType(new Map(), expandType('Map<MapKeyBase, number>'), 'loc', 'name', true, warn, 0) === true;
}
function testUnionKeysValidate() {
  // Union keys check each runtime key: members pass, others fail.
  const expect = expandType('Map<"admin" | "user", boolean>');
  return validateType(new Map([['admin', true]]), expect, 'loc', 'name', true, warn, 0) === true &&
    validateType(new Map([['root', false]]), expect, 'loc', 'name', true, warn, 0) === false;
}
function testTypedefKeysValidate() {
  // Typedef keys resolve through the registry.
  registerTypedef('MapRole', expandType('"admin" | "user" | "guest"'));
  const expect = expandType('Map<MapRole, boolean>');
  return validateType(new Map([['guest', false]]), expect, 'loc', 'name', true, warn, 0) === true &&
    validateType(new Map([['root', false]]), expect, 'loc', 'name', true, warn, 0) === false;
}
function testLiteralKeyValidates() {
  // Literal keys match exactly, including numeric ones (map keys are real
  // values, so no canonical-string detour is needed).
  return validateType(new Map([['a', 1]]), expandType('Map<"a", number>'), 'loc', 'name', true, warn, 0) === true &&
    validateType(new Map([['b', 1]]), expandType('Map<"a", number>'), 'loc', 'name', true, warn, 0) === false &&
    validateType(new Map([[1, 'x']]), expandType('Map<1 | 2, string>'), 'loc', 'name', true, warn, 0) === true &&
    validateType(new Map([[3, 'x']]), expandType('Map<1 | 2, string>'), 'loc', 'name', true, warn, 0) === false;
}
const tests = [
  testStringKeysStillWork,
  testNumberKeysPass,
  testNumberKeysRejectStrings,
  testClassKeysPass,
  testClassKeysRejectOthers,
  testNonMapFails,
  testEmptyMapPasses,
  testUnionKeysValidate,
  testTypedefKeysValidate,
  testLiteralKeyValidates,
];
export {tests};
