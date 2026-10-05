import {validateType} from './validateType.js';
import './resolveTemplateLiteralCandidates.js';
import './resolveTemplateLiteralValues.js';
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
function testPartialDeepNesting() {
  // Doubly and triply nested Partials stay fully optional without rejecting valid subsets.
  prepare();
  const double = expandType('Partial<Partial<PhSmall> >');
  if (validateType({}, double, 'loc', 'name', true, warn, 0) !== true) {
    return false;
  }
  if (validateType({a: 1}, double, 'loc', 'name', true, warn, 0) !== true) {
    return false;
  }
  if (validateType({a: 'x'}, double, 'loc', 'name', true, warn, 0) !== false) {
    return false;
  }
  const triple = expandType('Partial<Partial<Partial<PhSmall> > >');
  if (validateType({b: 's'}, triple, 'loc', 'name', true, warn, 0) !== true) {
    return false;
  }
  return validateType({b: 1}, triple, 'loc', 'name', true, warn, 0) === false;
}
function testPartialNestedPickOmit() {
  // Partial composes with Pick/Omit: picked-away and omitted keys stay rejected while kept keys turn optional.
  prepare();
  const pick = expandType('Partial<Pick<PhSmall, "a">>');
  if (validateType({}, pick, 'loc', 'name', true, warn, 0) !== true) {
    return false;
  }
  if (validateType({b: 's'}, pick, 'loc', 'name', true, warn, 0) !== false) {
    return false;
  }
  const omit = expandType('Partial<Omit<PhSmall, "a">>');
  if (validateType({b: 's'}, omit, 'loc', 'name', true, warn, 0) !== true) {
    return false;
  }
  return validateType({a: 1}, omit, 'loc', 'name', true, warn, 0) === false;
}
function testPartialTuple() {
  // Tuples stay tuples with optional undefined-able members instead of rejecting every tuple outright.
  prepare();
  const expect = expandType('Partial<[number, string]>');
  if (validateType([1, 's'], expect, 'loc', 'name', true, warn, 0) !== true) {
    return false;
  }
  if (validateType([1, undefined], expect, 'loc', 'name', true, warn, 0) !== true) {
    return false;
  }
  return validateType({}, expect, 'loc', 'name', true, warn, 0) === false;
}
function testRequiredTuple() {
  // Required strips tuple member optionality but keeps element types, so valid tuples still pass.
  prepare();
  const expect = expandType('Required<[number, string]>');
  if (validateType([1, 's'], expect, 'loc', 'name', true, warn, 0) !== true) {
    return false;
  }
  return validateType(['s', 's'], expect, 'loc', 'name', true, warn, 0) === false;
}
function testPartialFunction() {
  // Bare signatures collapse to `{}` under Partial: every non-nullish value passes, nullish fails.
  prepare();
  const expect = expandType('Partial<() => void>');
  if (validateType(() => {}, expect, 'loc', 'name', true, warn, 0) !== true) {
    return false;
  }
  if (validateType(1, expect, 'loc', 'name', true, warn, 0) !== true) {
    return false;
  }
  return validateType(null, expect, 'loc', 'name', true, warn, 0) === false;
}
function testPartialTypedefAlias() {
  // Typedef aliases to primitives resolve before passthrough, so Partial<Id> with Id=number takes numbers.
  prepare();
  registerTypedef('PhId', 'number');
  const expect = expandType('Partial<PhId>');
  if (validateType(5, expect, 'loc', 'name', true, warn, 0) !== true) {
    return false;
  }
  return validateType('x', expect, 'loc', 'name', true, warn, 0) === false;
}
function testPartialWrappers() {
  // Transparent wrappers keep homomorphic behavior: NonNullable unwraps unions, Readonly keeps shape.
  prepare();
  const nonNull = expandType('Partial<NonNullable<PhSmall | null>>');
  if (validateType({}, nonNull, 'loc', 'name', true, warn, 0) !== true) {
    return false;
  }
  if (validateType({a: 'x'}, nonNull, 'loc', 'name', true, warn, 0) !== false) {
    return false;
  }
  const readonly = expandType('Partial<Readonly<PhSmall>>');
  if (validateType({b: 's'}, readonly, 'loc', 'name', true, warn, 0) !== true) {
    return false;
  }
  return validateType({b: 1}, readonly, 'loc', 'name', true, warn, 0) === false;
}
function testPartialGenericAlias() {
  // Generic aliases instantiate before Partial applies, so Partial<Pick<T,...>>-style helpers work per argument.
  prepare();
  registerTypedef('PhPartial', expandType('Partial<T>'), ['T']);
  const expect = expandType('PhPartial<PhSmall>');
  if (validateType({a: 1}, expect, 'loc', 'name', true, warn, 0) !== true) {
    return false;
  }
  return validateType({a: 'x'}, expect, 'loc', 'name', true, warn, 0) === false;
}
function testMixedUnionExcessDeliberate() {
  // Mixed literals against a Partial union are rejected by exactObjects while tsc accepts them structurally.
  prepare();
  registerTypedef('PhOther', expandType('{c: boolean}'));
  const expect = expandType('Partial<PhSmall | PhOther>');
  if (validateType({}, expect, 'loc', 'name', true, warn, 0) !== true) {
    return false;
  }
  return validateType({a: 1, c: true}, expect, 'loc', 'name', true, warn, 0) === false;
}
class SubAnimal {
  constructor() {
    this.legs = 0;
  }
}
class SubDog extends SubAnimal {
  constructor() {
    super();
    this.bark = 'woof';
  }
}
function prepareAnimals() {
  clearTypedefs();
  registerClass(SubAnimal);
  registerClass(SubDog);
  registerTypedef('SubAnimal', {type: 'object', properties: {legs: 'number'}});
  registerTypedef('SubDog', {type: 'object', properties: {legs: 'number', bark: 'string'}});
  registerTypedef('SubZoo', expandType('{star: SubAnimal, count: number}'));
}
function testPartialSubclassNominal() {
  // Subclass instances satisfy Partial of the base nominally, like the bare class check does.
  prepareAnimals();
  const expect = expandType('Partial<SubAnimal>');
  if (validateType(new SubDog(), expect, 'loc', 'name', true, warn, 0) !== true) {
    return false;
  }
  if (validateType(new SubAnimal(), expect, 'loc', 'name', true, warn, 0) !== true) {
    return false;
  }
  return validateType({legs: 'bad'}, expect, 'loc', 'name', true, warn, 0) === false;
}
function testUtilitiesAcceptInstances() {
  // Required/Pick/Omit of a class accept its instances (including subclasses) outright.
  prepareAnimals();
  if (validateType(new SubDog(), expandType('Required<SubAnimal>'), 'loc', 'name', true, warn, 0) !== true) {
    return false;
  }
  if (validateType(new SubDog(), expandType('Pick<SubAnimal, "legs">'), 'loc', 'name', true, warn, 0) !== true) {
    return false;
  }
  if (validateType(new SubDog(), expandType('Omit<SubAnimal, "legs">'), 'loc', 'name', true, warn, 0) !== true) {
    return false;
  }
  return validateType(new SubAnimal(), expandType('Pick<SubDog, "bark">'), 'loc', 'name', true, warn, 0) === false;
}
function testPartialIndexedSubclass() {
  // The nominal shortcut survives indexed access: Partial<Zoo['star']> takes subclass instances.
  prepareAnimals();
  const expect = expandType('Partial<SubZoo["star"]>');
  if (validateType(new SubDog(), expect, 'loc', 'name', true, warn, 0) !== true) {
    return false;
  }
  return validateType({legs: 'bad'}, expect, 'loc', 'name', true, warn, 0) === false;
}
function testPartialIntersection() {
  // Intersections merge member shapes before optionality applies.
  prepare();
  registerTypedef('PhOther', expandType('{c: boolean}'));
  const expect = expandType('Partial<PhSmall & PhOther>');
  if (validateType({}, expect, 'loc', 'name', true, warn, 0) !== true) {
    return false;
  }
  if (validateType({a: 1, c: true}, expect, 'loc', 'name', true, warn, 0) !== true) {
    return false;
  }
  return validateType({a: 'x', c: true}, expect, 'loc', 'name', true, warn, 0) === false;
}
function testPartialCondition() {
  // Decidable conditions resolve to a branch first, so Partial applies to the denoted shape.
  prepare();
  registerTypedef('PhOther', expandType('{c: boolean}'));
  registerTypedef('PhMode', 'string');
  registerTypedef('PhCond', expandType('PhMode extends string ? PhSmall : PhOther'));
  const expect = expandType('Partial<PhCond>');
  if (validateType({a: 1}, expect, 'loc', 'name', true, warn, 0) !== true) {
    return false;
  }
  return validateType({a: 'x'}, expect, 'loc', 'name', true, warn, 0) === false;
}
function testPartialRecord() {
  // Records stay records with undefined-able values; Required keeps them exactly.
  prepare();
  const partial = expandType('Partial<Record<string, number>>');
  if (validateType({}, partial, 'loc', 'name', true, warn, 0) !== true) {
    return false;
  }
  if (validateType({k: 1}, partial, 'loc', 'name', true, warn, 0) !== true) {
    return false;
  }
  if (validateType({k: 'x'}, partial, 'loc', 'name', true, warn, 0) !== false) {
    return false;
  }
  const required = expandType('Required<Record<string, number>>');
  if (validateType({k: 1}, required, 'loc', 'name', true, warn, 0) !== true) {
    return false;
  }
  return validateType({k: 'x'}, required, 'loc', 'name', true, warn, 0) === false;
}
function testIndexSignaturesPreserved() {
  // Index-signature shapes survive Partial/Required with base behavior intact.
  prepare();
  registerTypedef('PhIdx', expandType('{[k: string]: number}'));
  const partial = expandType('Partial<PhIdx>');
  if (validateType({}, partial, 'loc', 'name', true, warn, 0) !== true) {
    return false;
  }
  const required = expandType('Required<PhIdx>');
  return validateType({}, required, 'loc', 'name', true, warn, 0) === true;
}
function testPlatformBases() {
  // Platform constructors reflect like key reads do: Partial takes instances and partial shapes.
  prepare();
  const partial = expandType('Partial<Date>');
  if (validateType(new Date(), partial, 'loc', 'name', true, warn, 0) !== true) {
    return false;
  }
  if (validateType({}, partial, 'loc', 'name', true, warn, 0) !== true) {
    return false;
  }
  if (validateType({getTime: 1}, partial, 'loc', 'name', true, warn, 0) !== false) {
    return false;
  }
  const required = expandType('Required<Date>');
  if (validateType(new Date(), required, 'loc', 'name', true, warn, 0) !== true) {
    return false;
  }
  return validateType({}, required, 'loc', 'name', true, warn, 0) === false;
}
function testIndexSignatureEnforcement() {
  // Signature-covered values validate against the value type, in bases and under utilities alike.
  prepare();
  registerTypedef('PhWords', expandType('{[n: number]: string, length: number}'));
  if (validateType({0: 'hi', length: 1}, 'PhWords', 'loc', 'name', true, warn, 0) !== true) {
    return false;
  }
  if (validateType({0: 1, length: 1}, 'PhWords', 'loc', 'name', true, warn, 0) !== false) {
    return false;
  }
  const partial = expandType('Partial<PhWords>');
  if (validateType({0: 'hi'}, partial, 'loc', 'name', true, warn, 0) !== true) {
    return false;
  }
  return validateType({0: 1}, partial, 'loc', 'name', true, warn, 0) === false;
}
function testPartialAny() {
  // `any` maps over its keys: an object bag admitting objects while rejecting primitives and nullish.
  prepare();
  const partial = expandType('Partial<any>');
  if (validateType({}, partial, 'loc', 'name', true, warn, 0) !== true) {
    return false;
  }
  if (validateType({a: 1}, partial, 'loc', 'name', true, warn, 0) !== true) {
    return false;
  }
  if (validateType(1, partial, 'loc', 'name', true, warn, 0) !== false) {
    return false;
  }
  return validateType(null, partial, 'loc', 'name', true, warn, 0) === false;
}
function testPartialUnknownNever() {
  // `unknown` maps over `never` keys (the bare object); `never` rejects every value.
  prepare();
  const unknown = expandType('Partial<unknown>');
  if (validateType(1, unknown, 'loc', 'name', true, warn, 0) !== true) {
    return false;
  }
  if (validateType(null, unknown, 'loc', 'name', true, warn, 0) !== false) {
    return false;
  }
  const never = expandType('Partial<never>');
  return validateType(1, never, 'loc', 'name', true, warn, 0) === false;
}
function testPartialTemplateKeyof() {
  // Finite template literals enumerate and key queries pass through untouched.
  prepare();
  const template = expandType('Partial<`on${"click" | "hover"}`>');
  if (validateType('onclick', template, 'loc', 'name', true, warn, 0) !== true) {
    return false;
  }
  if (validateType('onmove', template, 'loc', 'name', true, warn, 0) !== false) {
    return false;
  }
  registerTypedef('PhKeys', expandType('{a: number}'));
  const keys = expandType('Partial<keyof PhKeys>');
  if (validateType('a', keys, 'loc', 'name', true, warn, 0) !== true) {
    return false;
  }
  return validateType('z', keys, 'loc', 'name', true, warn, 0) === false;
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
  testPickIndexedAccess,
  testPartialDeepNesting,
  testPartialNestedPickOmit,
  testPartialTuple,
  testRequiredTuple,
  testPartialFunction,
  testPartialTypedefAlias,
  testPartialWrappers,
  testPartialGenericAlias,
  testMixedUnionExcessDeliberate,
  testPartialSubclassNominal,
  testUtilitiesAcceptInstances,
  testPartialIndexedSubclass,
  testPartialIntersection,
  testPartialCondition,
  testPartialRecord,
  testIndexSignaturesPreserved,
  testPlatformBases,
  testIndexSignatureEnforcement,
  testPartialAny,
  testPartialUnknownNever,
  testPartialTemplateKeyof
];
export {tests};
