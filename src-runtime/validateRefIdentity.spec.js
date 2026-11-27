import {validateType} from './validateType.js';
import {classes, registerClass, canonicalNameOf} from './registerClass.js';
import {registeredNameOf} from './registeredNameOf.js';
const warn = () => undefined;
/**
 * @returns {{warnings: *[], warn: Function}} Collector plus warn function.
 */
function failingWarnCollector() {
  const warnings = [];
  return {
    warnings,
    warn: (...args) => {
      warnings.push(args[0]);
      return undefined;
    },
  };
}
function cleanup(names) {
  for (const name of names) {
    delete classes[name];
  }
}
/**
 * Simulates a minifier: a class whose runtime name is mangled but whose
 * canonical (pre-bundle) spelling is registered alongside the binding.
 * @returns {boolean} True when the mangled instance validates.
 */
function testRefSurvivesMangledName() {
  function MangledVec() {}
  Object.defineProperty(MangledVec, 'name', {
    value: 'e',
  });
  registerClass(MangledVec, 'Vec');
  try {
    const v = new MangledVec();
    const expect = {
      type: 'reference',
      name: 'Vec',
      args: [],
      ref: MangledVec,
    };
    return validateType(v, expect, 'loc', 'arg', true, warn, 0) === true;
  } finally {
    cleanup(['Vec']);
  }
}
function testRefRejectsWrongClass() {
  function MangledVec() {}
  Object.defineProperty(MangledVec, 'name', {
    value: 'e',
  });
  function Other() {}
  registerClass(MangledVec, 'Vec');
  try {
    const expect = {
      type: 'reference',
      name: 'Vec',
      args: [],
      ref: MangledVec,
    };
    const collected = failingWarnCollector();
    const ret = validateType(new Other(), expect, 'loc', 'arg', true, collected.warn, 0);
    return ret === false;
  } finally {
    cleanup(['Vec']);
  }
}
function testRefAcceptsSnapshotTag() {
  function MangledVec() {}
  Object.defineProperty(MangledVec, 'name', {
    value: 'e',
  });
  registerClass(MangledVec, 'Vec');
  try {
    const expect = {
      type: 'reference',
      name: 'Vec',
      args: [],
      ref: MangledVec,
    };
    const snapshot = {
      x: 1,
      $type: 'Vec',
    };
    return validateType(snapshot, expect, 'loc', 'arg', true, warn, 0) === true;
  } finally {
    cleanup(['Vec']);
  }
}
function testCanonicalNameRegistered() {
  function MangledVec() {}
  Object.defineProperty(MangledVec, 'name', {
    value: 'e',
  });
  registerClass(MangledVec, 'Vec');
  try {
    return canonicalNameOf(MangledVec) === 'Vec' && registeredNameOf(MangledVec) === 'Vec' &&
      classes.Vec === MangledVec;
  } finally {
    cleanup(['Vec']);
  }
}
function testGenericRefStillChecksArgs() {
  // With type arguments the reference takes the normal generic path, not
  // the identity fast path: registration by canonical name keeps the
  // nominal check working under a mangled runtime name.
  function MangledBox() {}
  Object.defineProperty(MangledBox, 'name', {
    value: 't',
  });
  registerClass(MangledBox, 'Box');
  try {
    const expect = {
      type: 'reference',
      name: 'Box',
      args: ['number'],
      ref: MangledBox,
    };
    const collected = failingWarnCollector();
    const {warn} = collected;
    return validateType(new MangledBox(), expect, 'loc', 'arg', true, warn, 0) === true;
  } finally {
    cleanup(['Box']);
  }
}
function testRefRejectsShadowedSameName() {
  // A same-named class from another scope shares the spelling but not the
  // identity: the fast path compares the live constructor, so the inner
  // duplicate fails instead of riding the registered name.
  class Vec {}
  registerClass(Vec, 'Vec');
  try {
    class InnerVec {}
    Object.defineProperty(InnerVec, 'name', {
      value: 'Vec',
    });
    const expect = {
      type: 'reference',
      name: 'Vec',
      args: [],
      ref: Vec,
    };
    return validateType(new InnerVec(), expect, 'loc', 'arg', true, warn, 0) === false;
  } finally {
    cleanup(['Vec']);
  }
}
function testRefValidatesFrozenExpect() {
  // Emitted expect trees are frozen before validation in some pipelines:
  // the live `ref` survives freezing (freezing stops at the key) and the
  // identity check reads it normally.
  function MangledVec() {}
  Object.defineProperty(MangledVec, 'name', {
    value: 'e',
  });
  registerClass(MangledVec, 'Vec');
  try {
    const expect = Object.freeze({
      type: 'reference',
      name: 'Vec',
      args: Object.freeze([]),
      ref: MangledVec,
    });
    return validateType(new MangledVec(), expect, 'loc', 'arg', true, warn, 0) === true;
  } finally {
    cleanup(['Vec']);
  }
}
const tests = [
  testRefSurvivesMangledName,
  testRefRejectsWrongClass,
  testRefAcceptsSnapshotTag,
  testCanonicalNameRegistered,
  testGenericRefStillChecksArgs,
  testRefRejectsShadowedSameName,
  testRefValidatesFrozenExpect,
];
export {tests};
