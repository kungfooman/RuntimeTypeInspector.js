import {prototypeShape, mergedClassShape} from './classShape.js';
import {classes} from './registerClass.js';
import {typedefs} from './registerTypedef.js';
/**
 * Drops a class registration the test added: `test_runtime.js` never clears
 * the class registry, so every mutation here cleans up after itself.
 * @param {string} name - The registered name.
 */
function dropClass(name) {
  delete classes[name];
}
/**
 * Drops a typedef registration the test added.
 * @param {string} name - The registered name.
 */
function dropTypedef(name) {
  delete typedefs[name];
}
function testNeverInstantiates() {
  // Keys come from prototypes, so a throwing constructor never runs while
  // its methods are still enumerated.
  class Boom {
    constructor() {
      throw new Error('must not run');
    }
    getValue() {
      return 1;
    }
  }
  return 'getValue' in prototypeShape(Boom).properties;
}
function testNonEnumerablesIncluded() {
  // Class methods are non-enumerable by definition: enumeration must use
  // getOwnPropertyNames-style reads, never Object.keys.
  class Calc {
    add() {
      return 1;
    }
  }
  return 'add' in prototypeShape(Calc).properties;
}
function testConstructorExcluded() {
  // `constructor` itself is never a key. Plain `in` would lie here
  // (inherited through `Object.prototype`), so the test uses own-checks.
  class Plain {
    work() {
      return 1;
    }
  }
  const {properties} = prototypeShape(Plain);
  const hasOwn = (key) => Object.prototype.hasOwnProperty.call(properties, key);
  return !hasOwn('constructor') && hasOwn('work');
}
function testStaticsExcluded() {
  // Statics live on the constructor, not the prototype: instance-side key
  // reads must not see them.
  class WithStatic {
    static helper() {
      return 1;
    }
    work() {
      return 2;
    }
  }
  const {properties} = prototypeShape(WithStatic);
  return !('helper' in properties) && 'work' in properties;
}
function testAccessorsReflected() {
  // Getters and setters enumerate like methods.
  class Access {
    set value(_) {}
    get value() {
      return 1;
    }
  }
  return 'value' in prototypeShape(Access).properties;
}
function testChainMerged() {
  // Base-chain members merge: subclass and base methods both enumerate.
  class Base {
    baseMethod() {
      return 1;
    }
  }
  class Child extends Base {
    childMethod() {
      return 2;
    }
  }
  const {properties} = prototypeShape(Child);
  return 'baseMethod' in properties && 'childMethod' in properties;
}
function testHarvestPreferred() {
  // A harvested shape replaces reflection for its level (not merged with
  // it): transpiler-known data properties enumerate from the harvest.
  class RtiHarv {
    realMethod() {
      return 1;
    }
  }
  classes.RtiHarv = RtiHarv;
  typedefs.RtiHarv = {type: 'object', properties: {harvestedProp: 'string'}};
  try {
    const {properties} = mergedClassShape('RtiHarv');
    return 'harvestedProp' in properties && !('realMethod' in properties);
  } finally {
    dropClass('RtiHarv');
    dropTypedef('RtiHarv');
  }
}
function testSubclassWins() {
  // Base-first merge: on key collision the subclass entry shadows the base
  // harvest, so a reflected method beats a harvested non-function.
  class RtiWBase {
    baseWork() {
      return 1;
    }
  }
  class RtiWSub extends RtiWBase {
    dup() {
      return 2;
    }
  }
  classes.RtiWBase = RtiWBase;
  classes.RtiWSub = RtiWSub;
  typedefs.RtiWBase = {type: 'object', properties: {dup: 'number'}};
  try {
    const {properties} = mergedClassShape('RtiWSub');
    return properties.dup === 'Function' && 'baseWork' in properties;
  } finally {
    dropClass('RtiWBase');
    dropClass('RtiWSub');
    dropTypedef('RtiWBase');
  }
}
function testReflectionFallbackPerLevel() {
  // Levels without a harvested shape contribute reflected members instead,
  // so unharvested hierarchies still merge across inheritance.
  class RtiPlainBase {
    baseWork() {
      return 1;
    }
  }
  class RtiPlainSub extends RtiPlainBase {
    subWork() {
      return 2;
    }
  }
  classes.RtiPlainBase = RtiPlainBase;
  classes.RtiPlainSub = RtiPlainSub;
  try {
    const {properties} = mergedClassShape('RtiPlainSub');
    return 'baseWork' in properties && 'subWork' in properties;
  } finally {
    dropClass('RtiPlainBase');
    dropClass('RtiPlainSub');
  }
}
export const tests = [
  testNeverInstantiates,
  testNonEnumerablesIncluded,
  testConstructorExcluded,
  testStaticsExcluded,
  testAccessorsReflected,
  testChainMerged,
  testHarvestPreferred,
  testSubclassWins,
  testReflectionFallbackPerLevel,
];
