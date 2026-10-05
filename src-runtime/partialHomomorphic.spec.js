import {validateType} from './validateType.js';
import {expandType} from '../src-transpiler/expandType.js';
import {registerTypedef, typedefs, typedefTemplates} from './registerTypedef.js';
import {registerClass} from './registerClass.js';
const warn = () => undefined;
function clearTypedefs() {
  Object.keys(typedefs).forEach((key) => delete typedefs[key]);
  Object.keys(typedefTemplates).forEach((key) => delete typedefTemplates[key]);
}
class PhColor {
  constructor() {
    this.r = 0;
    this.g = 0;
    this.b = 0;
    this.a = 1;
  }
}
function prepare() {
  clearTypedefs();
  registerClass(PhColor);
  registerTypedef('PhColor', {type: 'object', properties: {r: 'number', g: 'number', b: 'number', a: 'number'}});
  registerTypedef('PhSmall', expandType('{a: number, b: string}'));
  registerTypedef('PhTheme', expandType('{nested: {[K in "x"|"y"]: PhSmall}, count: number, single: PhSmall}'));
}
function testExpandKeepsDeepPartial() {
  // The gizmo shape survives transpilation as an optional mapping over Partial indexed access.
  const node = expandType('{ [K in keyof PhTheme]?: Partial<PhTheme[K]> }');
  return !!node && node.type === 'mapping' && node.element === 'K' &&
    node.question === '?' && node.iterable && node.iterable.type === 'keyof' &&
    node.result && node.result.type === 'reference' && node.result.name === 'Partial' &&
    Array.isArray(node.result.args) && node.result.args[0] && node.result.args[0].type === 'indexedAccess';
}
function testPartialNumberPassthrough() {
  // Partial over a primitive is the primitive itself, so numbers pass and objects fail like tsc.
  prepare();
  const expect = expandType('Partial<number>');
  if (validateType(1, expect, 'loc', 'name', true, warn, 0) !== true) {
    return false;
  }
  return validateType({}, expect, 'loc', 'name', true, warn, 0) === false;
}
function testPartialUnionDistributes() {
  // Union members keep their own Partial form: primitives pass through while objects turn optional.
  prepare();
  const expect = expandType('Partial<PhSmall|number>');
  if (validateType(1, expect, 'loc', 'name', true, warn, 0) !== true) {
    return false;
  }
  if (validateType({a: 1}, expect, 'loc', 'name', true, warn, 0) !== true) {
    return false;
  }
  if (validateType({}, expect, 'loc', 'name', true, warn, 0) !== true) {
    return false;
  }
  if (validateType({a: 'x'}, expect, 'loc', 'name', true, warn, 0) !== false) {
    return false;
  }
  return validateType(true, expect, 'loc', 'name', true, warn, 0) === false;
}
function testPartialIndexedAccessPrimitive() {
  // Indexed access denoting a number resolves first, so Partial of it still accepts numbers.
  prepare();
  const expect = expandType('Partial<PhTheme["count"]>');
  if (validateType(0.5, expect, 'loc', 'name', true, warn, 0) !== true) {
    return false;
  }
  return validateType('bad', expect, 'loc', 'name', true, warn, 0) === false;
}
function testPartialIndexedAccessObject() {
  // Indexed access denoting a mapping resolves, so Partial of it accepts deep partials.
  prepare();
  const expect = expandType('Partial<PhTheme["nested"]>');
  if (validateType({x: {a: 1, b: 's'}}, expect, 'loc', 'name', true, warn, 0) !== true) {
    return false;
  }
  if (validateType({}, expect, 'loc', 'name', true, warn, 0) !== true) {
    return false;
  }
  return validateType({x: 123}, expect, 'loc', 'name', true, warn, 0) === false;
}
function testPartialClass() {
  // Partial over a registered class accepts instances, empty objects and subsets with correct types.
  prepare();
  const expect = expandType('Partial<PhColor>');
  if (validateType(new PhColor(), expect, 'loc', 'name', true, warn, 0) !== true) {
    return false;
  }
  if (validateType({}, expect, 'loc', 'name', true, warn, 0) !== true) {
    return false;
  }
  if (validateType({r: 1}, expect, 'loc', 'name', true, warn, 0) !== true) {
    return false;
  }
  return validateType({r: 'bad'}, expect, 'loc', 'name', true, warn, 0) === false;
}
function testPartialArray() {
  // Arrays stay arrays with optional elements instead of rejecting every array outright.
  prepare();
  const expect = expandType('Partial<string[]>');
  if (validateType(['a'], expect, 'loc', 'name', true, warn, 0) !== true) {
    return false;
  }
  if (validateType(['a', undefined], expect, 'loc', 'name', true, warn, 0) !== true) {
    return false;
  }
  if (validateType({}, expect, 'loc', 'name', true, warn, 0) !== false) {
    return false;
  }
  return validateType(['a', 1], expect, 'loc', 'name', true, warn, 0) === false;
}
function testRequiredPassthrough() {
  // Required mirrors Partial homomorphically: primitives pass through and unions distribute.
  prepare();
  if (validateType(1, expandType('Required<number>'), 'loc', 'name', true, warn, 0) !== true) {
    return false;
  }
  if (validateType({}, expandType('Required<number>'), 'loc', 'name', true, warn, 0) !== false) {
    return false;
  }
  const union = expandType('Required<PhSmall|number>');
  if (validateType(1, union, 'loc', 'name', true, warn, 0) !== true) {
    return false;
  }
  if (validateType({a: 1, b: 's'}, union, 'loc', 'name', true, warn, 0) !== true) {
    return false;
  }
  return validateType({}, union, 'loc', 'name', true, warn, 0) === false;
}
function testDeepPartialMapping() {
  // End-to-end gizmo shape: outer optional mapping with per-key Partial accepts mixed themes.
  prepare();
  const expect = expandType('{ [K in keyof PhTheme]?: Partial<PhTheme[K]> }');
  if (validateType({}, expect, 'loc', 'name', true, warn, 0) !== true) {
    return false;
  }
  if (validateType({count: 1, nested: {x: {a: 1, b: 's'}}}, expect, 'loc', 'name', true, warn, 0) !== true) {
    return false;
  }
  if (validateType({single: {a: 1}}, expect, 'loc', 'name', true, warn, 0) !== true) {
    return false;
  }
  if (validateType({count: 'bad'}, expect, 'loc', 'name', true, warn, 0) !== false) {
    return false;
  }
  if (validateType({nested: {x: 123}}, expect, 'loc', 'name', true, warn, 0) !== false) {
    return false;
  }
  return validateType({unknown: 1}, expect, 'loc', 'name', true, warn, 0) === false;
}
function testPickIndexedAccess() {
  // Pick over indexed access resolves the base first, so selections from nested shapes work.
  prepare();
  const expect = expandType('Pick<PhTheme["single"], "a">');
  if (validateType({a: 1}, expect, 'loc', 'name', true, warn, 0) !== true) {
    return false;
  }
  return validateType({a: 'x'}, expect, 'loc', 'name', true, warn, 0) === false;
}
const tests = [
  testExpandKeepsDeepPartial,
  testPartialNumberPassthrough,
  testPartialUnionDistributes,
  testPartialIndexedAccessPrimitive,
  testPartialIndexedAccessObject,
  testPartialClass,
  testPartialArray,
  testRequiredPassthrough,
  testDeepPartialMapping,
  testPickIndexedAccess
];
export {tests};
