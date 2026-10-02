import {validateType} from './validateType.js';
import {classes, registerClass} from './registerClass.js';
import {variables, variableKinds, registerVariable} from './registerVariable.js';
import {expandType} from '../src-transpiler/expandType.js';
const warn = () => undefined;
class TypeofBase {
  constructor() {
    this.enabled = true;
  }
  update() {}
}
class TypeofChild extends TypeofBase {
  constructor() {
    super();
    this.speed = 1;
  }
}
class TypeofGrandChild extends TypeofChild {
  constructor() {
    super();
    this.boost = 2;
  }
}
class TypeofUnrelated {
  constructor() {
    this.label = 'x';
  }
}
function TypeofLegacy() {}
TypeofLegacy.prototype = Object.create(TypeofBase.prototype);
TypeofLegacy.prototype.constructor = TypeofLegacy;
function TypeofModern() {}
TypeofModern.prototype = Object.create(TypeofBase.prototype);
TypeofModern.prototype.constructor = TypeofModern;
Object.setPrototypeOf(TypeofModern, TypeofBase);
/**
 * Registers scratch classes/variables, runs the check, then removes them
 * so later specs observe a clean registry.
 * @param {Function} check - The assertion to run while registered.
 * @returns {boolean} The assertion result.
 */
function withTypeofTargets(check) {
  registerClass(TypeofBase);
  registerClass(TypeofChild);
  registerClass(TypeofGrandChild);
  registerClass(TypeofUnrelated);
  registerClass(TypeofLegacy);
  registerClass(TypeofModern);
  try {
    return check();
  } finally {
    delete classes.TypeofBase;
    delete classes.TypeofChild;
    delete classes.TypeofGrandChild;
    delete classes.TypeofUnrelated;
    delete classes.TypeofLegacy;
    delete classes.TypeofModern;
    delete variables.typeofPrimitives;
    delete variables.typeofOptions;
    delete variables.typeofFactory;
    delete variables.typeofConstMotion;
    delete variables.typeofConstAnswer;
    delete variables.typeofConstNan;
    delete variables.typeofLetCount;
    delete variableKinds.typeofPrimitives;
    delete variableKinds.typeofOptions;
    delete variableKinds.typeofFactory;
    delete variableKinds.typeofConstMotion;
    delete variableKinds.typeofConstAnswer;
    delete variableKinds.typeofConstNan;
    delete variableKinds.typeofLetCount;
  }
}
function testExpandsToTypeof() {
  // The transpiler must emit a typeof node (not a plain reference).
  const expect = expandType('typeof TypeofBase');
  return expect && expect.type === 'typeof' && expect.argument === 'TypeofBase';
}
function testIdentityPasses() {
  // `typeof Base` accepts Base itself.
  return withTypeofTargets(() => validateType(TypeofBase,
                                              {type: 'typeof', argument: 'TypeofBase'}, 'loc', 'name', true, warn, 0) === true);
}
function testDirectSubclassPasses() {
  // `typeof Base` accepts a direct subclass (the registerScript case).
  return withTypeofTargets(() => validateType(TypeofChild,
                                              {type: 'typeof', argument: 'TypeofBase'}, 'loc', 'name', true, warn, 0) === true);
}
function testIndirectSubclassPasses() {
  // `typeof Base` accepts an indirect subclass through the chain.
  return withTypeofTargets(() => validateType(TypeofGrandChild,
                                              {type: 'typeof', argument: 'TypeofBase'}, 'loc', 'name', true, warn, 0) === true);
}
function testPrototypeLinkedPasses() {
  // `typeof Base` accepts createScript-style prototype linkage (no extends).
  return withTypeofTargets(() => validateType(TypeofLegacy,
                                              {type: 'typeof', argument: 'TypeofBase'}, 'loc', 'name', true, warn, 0) === true);
}
function testStaticAndPrototypeLinkedPasses() {
  // Newer `createScript` shape (prototype linkage plus static inheritance)
  // still satisfies `typeof Base` through the prototype chain.
  return withTypeofTargets(() => validateType(TypeofModern,
                                              {type: 'typeof', argument: 'TypeofBase'}, 'loc', 'name', true, warn, 0) === true);
}
function testUnrelatedClassFails() {
  // `typeof Base` rejects an unrelated class, warning (not silently).
  return withTypeofTargets(() => {
    const warnings = [];
    const ret = validateType(TypeofUnrelated,
                             {type: 'typeof', argument: 'TypeofBase'}, 'loc', 'name', true, (...args) => warnings.push(args[0]), 0);
    return ret === false && warnings.length > 0 && !warnings.includes('unchecked');
  });
}
function testInstanceFails() {
  // `typeof Base` rejects instances: constructors, not objects, are wanted.
  return withTypeofTargets(() => validateType(new TypeofChild(),
                                              {type: 'typeof', argument: 'TypeofBase'}, 'loc', 'name', true, warn, 0) === false);
}
function testNonFunctionFails() {
  // `typeof Base` rejects strings, nullish is handled by strictNullChecks.
  return withTypeofTargets(() => validateType('TypeofChild', {type: 'typeof', argument: 'TypeofBase'}, 'loc', 'name', true, warn, 0) === false &&
    validateType({}, {type: 'typeof', argument: 'TypeofBase'}, 'loc', 'name', true, warn, 0) === false);
}
function testSubclassOfChildStillCheckedAgainstBase() {
  // Narrower queries keep working: grandchild is a child, unrelated is not.
  return withTypeofTargets(() => validateType(TypeofGrandChild, {type: 'typeof', argument: 'TypeofChild'}, 'loc', 'name', true, warn, 0) === true &&
    validateType(TypeofBase, {type: 'typeof', argument: 'TypeofChild'}, 'loc', 'name', true, warn, 0) === false);
}
function testUnknownTargetFailsClosedWithUnchecked() {
  // Unresolvable targets fail closed and say `unchecked` for diagnosis.
  const warnings = [];
  const ret = validateType(class {}, {type: 'typeof', argument: 'NoSuchTypeofTarget'}, 'loc', 'name',
                           true, (...args) => warnings.push(args[0]), 0);
  return ret === false && warnings.includes('unchecked');
}
function testGlobalConstructorFallback() {
  // Unregistered platform constructors resolve via globalThis (and subclass).
  return validateType(Float32Array, {type: 'typeof', argument: 'Float32Array'}, 'loc', 'name', true, warn, 0) === true &&
    validateType(Uint8Array, {type: 'typeof', argument: 'Float32Array'}, 'loc', 'name', true, warn, 0) === false;
}
function testTypeofValuePrimitive() {
  // `typeof someLet` without a recorded kind widens (legacy registrations).
  return withTypeofTargets(() => {
    registerVariable('typeofPrimitives', 5);
    return validateType(6, {type: 'typeof', argument: 'typeofPrimitives'}, 'loc', 'name', true, warn, 0) === true &&
      validateType('6', {type: 'typeof', argument: 'typeofPrimitives'}, 'loc', 'name', true, warn, 0) === false;
  });
}
function testTypeofLetWidens() {
  // `let count = 5` widens: `typeof count` is `number`, any number passes.
  return withTypeofTargets(() => {
    registerVariable('typeofLetCount', 5, 'let');
    return validateType(6, {type: 'typeof', argument: 'typeofLetCount'}, 'loc', 'name', true, warn, 0) === true &&
      validateType('6', {type: 'typeof', argument: 'typeofLetCount'}, 'loc', 'name', true, warn, 0) === false;
  });
}
function testTypeofConstStringIsLiteral() {
  // `const MOTION = 'free'`: `typeof MOTION` is `'free'` — exact match only.
  return withTypeofTargets(() => {
    registerVariable('typeofConstMotion', 'free', 'const');
    return validateType('free', {type: 'typeof', argument: 'typeofConstMotion'}, 'loc', 'name', true, warn, 0) === true &&
      validateType('limited', {type: 'typeof', argument: 'typeofConstMotion'}, 'loc', 'name', true, warn, 0) === false &&
      validateType(5, {type: 'typeof', argument: 'typeofConstMotion'}, 'loc', 'name', true, warn, 0) === false;
  });
}
function testTypeofConstNumberIsLiteral() {
  // `const ANSWER = 42`: `typeof ANSWER` is `42`, other numbers fail.
  return withTypeofTargets(() => {
    registerVariable('typeofConstAnswer', 42, 'const');
    return validateType(42, {type: 'typeof', argument: 'typeofConstAnswer'}, 'loc', 'name', true, warn, 0) === true &&
      validateType(43, {type: 'typeof', argument: 'typeofConstAnswer'}, 'loc', 'name', true, warn, 0) === false;
  });
}
function testTypeofConstNanWidens() {
  // `const X = NaN` widens like tsc (`NaN` is no literal): numbers pass.
  return withTypeofTargets(() => {
    registerVariable('typeofConstNan', NaN, 'const');
    return validateType(1, {type: 'typeof', argument: 'typeofConstNan'}, 'loc', 'name', true, warn, 0) === true &&
      validateType('1', {type: 'typeof', argument: 'typeofConstNan'}, 'loc', 'name', true, warn, 0) === false;
  });
}
function testTypeofValueObject() {
  // `typeof someObj`: same-constructor objects (incl. subclasses) pass.
  return withTypeofTargets(() => {
    registerVariable('typeofOptions', new TypeofChild());
    return validateType(new TypeofChild(), {type: 'typeof', argument: 'typeofOptions'}, 'loc', 'name', true, warn, 0) === true &&
      validateType(new TypeofGrandChild(), {type: 'typeof', argument: 'typeofOptions'}, 'loc', 'name', true, warn, 0) === true &&
      validateType(new TypeofUnrelated(), {type: 'typeof', argument: 'typeofOptions'}, 'loc', 'name', true, warn, 0) === false;
  });
}
function testTypeofValueConstructor() {
  // `typeof someClassValue`: subclasses of the registered value pass.
  return withTypeofTargets(() => {
    registerVariable('typeofFactory', TypeofChild);
    return validateType(TypeofGrandChild, {type: 'typeof', argument: 'typeofFactory'}, 'loc', 'name', true, warn, 0) === true &&
      validateType(TypeofUnrelated, {type: 'typeof', argument: 'typeofFactory'}, 'loc', 'name', true, warn, 0) === false;
  });
}
const tests = [
  testExpandsToTypeof,
  testIdentityPasses,
  testDirectSubclassPasses,
  testIndirectSubclassPasses,
  testPrototypeLinkedPasses,
  testStaticAndPrototypeLinkedPasses,
  testUnrelatedClassFails,
  testInstanceFails,
  testNonFunctionFails,
  testSubclassOfChildStillCheckedAgainstBase,
  testUnknownTargetFailsClosedWithUnchecked,
  testGlobalConstructorFallback,
  testTypeofValuePrimitive,
  testTypeofLetWidens,
  testTypeofConstStringIsLiteral,
  testTypeofConstNumberIsLiteral,
  testTypeofConstNanWidens,
  testTypeofValueObject,
  testTypeofValueConstructor,
];
export {tests};
