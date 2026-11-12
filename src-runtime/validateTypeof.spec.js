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
  return (
    expect &&
    expect.type === 'typeof' &&
    expect.argument === 'TypeofBase'
  );
}
function testIdentityPasses() {
  // `typeof Base` accepts Base itself.
  return withTypeofTargets(() => {
    const expect = {
      type: 'typeof',
      argument: 'TypeofBase',
    };
    return validateType(TypeofBase, expect, 'loc', 'name', true, warn, 0) === true;
  });
}
function testDirectSubclassPasses() {
  // `typeof Base` accepts a direct subclass (the registerScript case).
  return withTypeofTargets(() => {
    const expect = {
      type: 'typeof',
      argument: 'TypeofBase',
    };
    return validateType(TypeofChild, expect, 'loc', 'name', true, warn, 0) === true;
  });
}
function testIndirectSubclassPasses() {
  // `typeof Base` accepts an indirect subclass through the chain.
  return withTypeofTargets(() => {
    const expect = {
      type: 'typeof',
      argument: 'TypeofBase',
    };
    return validateType(TypeofGrandChild, expect, 'loc', 'name', true, warn, 0) === true;
  });
}
function testPrototypeLinkedPasses() {
  // `typeof Base` accepts createScript-style prototype linkage (no extends).
  return withTypeofTargets(() => {
    const expect = {
      type: 'typeof',
      argument: 'TypeofBase',
    };
    return validateType(TypeofLegacy, expect, 'loc', 'name', true, warn, 0) === true;
  });
}
function testStaticAndPrototypeLinkedPasses() {
  // Newer `createScript` shape (prototype linkage plus static inheritance)
  // still satisfies `typeof Base` through the prototype chain.
  return withTypeofTargets(() => {
    const expect = {
      type: 'typeof',
      argument: 'TypeofBase',
    };
    return validateType(TypeofModern, expect, 'loc', 'name', true, warn, 0) === true;
  });
}
function testUnrelatedClassFails() {
  // `typeof Base` rejects an unrelated class, warning (not silently).
  return withTypeofTargets(() => {
    const warnings = [];
    const ret = validateType(
      TypeofUnrelated,
      {
        type: 'typeof',
        argument: 'TypeofBase',
      },
      'loc',
      'name',
      true,
      (...args) => warnings.push(args[0]),
      0,
    );
    return (
      ret === false &&
      warnings.length > 0 &&
      !warnings.includes('unchecked')
    );
  });
}
function testInstanceFails() {
  // `typeof Base` rejects instances: constructors, not objects, are wanted.
  return withTypeofTargets(() => {
    const expect = {
      type: 'typeof',
      argument: 'TypeofBase',
    };
    return validateType(new TypeofChild(), expect, 'loc', 'name', true, warn, 0) === false;
  });
}
function testNonFunctionFails() {
  // `typeof Base` rejects strings, nullish is handled by strictNullChecks.
  return withTypeofTargets(() => {
    const expect = {
      type: 'typeof',
      argument: 'TypeofBase',
    };
    const stringOk = validateType('TypeofChild', expect, 'loc', 'name', true, warn, 0) === false;
    return stringOk && validateType({}, expect, 'loc', 'name', true, warn, 0) === false;
  });
}
function testSubclassOfChildStillCheckedAgainstBase() {
  // Narrower queries keep working: grandchild is a child, unrelated is not.
  return withTypeofTargets(() => {
    const expect = {
      type: 'typeof',
      argument: 'TypeofChild',
    };
    const childOk = validateType(TypeofGrandChild, expect, 'loc', 'name', true, warn, 0) === true;
    return childOk && validateType(TypeofBase, expect, 'loc', 'name', true, warn, 0) === false;
  });
}
function testUnknownTargetFailsClosedWithUnchecked() {
  // Unresolvable targets fail closed and say `unchecked` for diagnosis.
  const warnings = [];
  const ret = validateType(
    class {},
    {
      type: 'typeof',
      argument: 'NoSuchTypeofTarget',
    },
    'loc',
    'name',
    true,
    (...args) => warnings.push(args[0]),
    0,
  );
  return ret === false && warnings.includes('unchecked');
}
function testGlobalConstructorFallback() {
  // Unregistered platform constructors resolve via globalThis (and subclass).
  const expect = {
    type: 'typeof',
    argument: 'Float32Array',
  };
  const directOk = validateType(Float32Array, expect, 'loc', 'name', true, warn, 0) === true;
  return directOk && validateType(Uint8Array, expect, 'loc', 'name', true, warn, 0) === false;
}
function testTypeofValuePrimitive() {
  // `typeof someLet` without a recorded kind widens (legacy registrations).
  return withTypeofTargets(() => {
    registerVariable('typeofPrimitives', 5);
    const expect = {
      type: 'typeof',
      argument: 'typeofPrimitives',
    };
    const firstOk = validateType(6, expect, 'loc', 'name', true, warn, 0) === true;
    return firstOk && validateType('6', expect, 'loc', 'name', true, warn, 0) === false;
  });
}
function testTypeofLetWidens() {
  // `let count = 5` widens: `typeof count` is `number`, any number passes.
  return withTypeofTargets(() => {
    registerVariable('typeofLetCount', 5, 'let');
    const expect = {
      type: 'typeof',
      argument: 'typeofLetCount',
    };
    const firstOk = validateType(6, expect, 'loc', 'name', true, warn, 0) === true;
    return firstOk && validateType('6', expect, 'loc', 'name', true, warn, 0) === false;
  });
}
function testTypeofConstStringIsLiteral() {
  // `const MOTION = 'free'`: `typeof MOTION` is `'free'` — exact match only.
  return withTypeofTargets(() => {
    registerVariable('typeofConstMotion', 'free', 'const');
    const expect = {
      type: 'typeof',
      argument: 'typeofConstMotion',
    };
    const freeOk = validateType('free', expect, 'loc', 'name', true, warn, 0) === true;
    const limitedOk = validateType('limited', expect, 'loc', 'name', true, warn, 0) === false;
    return freeOk && limitedOk && validateType(5, expect, 'loc', 'name', true, warn, 0) === false;
  });
}
function testTypeofConstNumberIsLiteral() {
  // `const ANSWER = 42`: `typeof ANSWER` is `42`, other numbers fail.
  return withTypeofTargets(() => {
    registerVariable('typeofConstAnswer', 42, 'const');
    const expect = {
      type: 'typeof',
      argument: 'typeofConstAnswer',
    };
    const firstOk = validateType(42, expect, 'loc', 'name', true, warn, 0) === true;
    return firstOk && validateType(43, expect, 'loc', 'name', true, warn, 0) === false;
  });
}
function testTypeofConstNanWidens() {
  // `const X = NaN` widens like tsc (`NaN` is no literal): numbers pass.
  return withTypeofTargets(() => {
    registerVariable('typeofConstNan', NaN, 'const');
    const expect = {
      type: 'typeof',
      argument: 'typeofConstNan',
    };
    const numberOk = validateType(1, expect, 'loc', 'name', true, warn, 0) === true;
    return numberOk && validateType('1', expect, 'loc', 'name', true, warn, 0) === false;
  });
}
function testTypeofValueObject() {
  // `typeof someObj`: same-constructor objects (incl. subclasses) pass.
  return withTypeofTargets(() => {
    registerVariable('typeofOptions', new TypeofChild());
    const expect = {
      type: 'typeof',
      argument: 'typeofOptions',
    };
    const childOk = validateType(new TypeofChild(), expect, 'loc', 'name', true, warn, 0) === true;
    const grandchildOk = validateType(new TypeofGrandChild(), expect, 'loc', 'name', true, warn, 0) === true;
    return childOk && grandchildOk && validateType(new TypeofUnrelated(), expect, 'loc', 'name', true, warn, 0) === false;
  });
}
function testTypeofValueConstructor() {
  // `typeof someClassValue`: subclasses of the registered value pass.
  return withTypeofTargets(() => {
    registerVariable('typeofFactory', TypeofChild);
    const expect = {
      type: 'typeof',
      argument: 'typeofFactory',
    };
    const grandchildOk = validateType(TypeofGrandChild, expect, 'loc', 'name', true, warn, 0) === true;
    return grandchildOk && validateType(TypeofUnrelated, expect, 'loc', 'name', true, warn, 0) === false;
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
