import {instantiateReference} from './instantiateReference.js';
import {registerTypedef, typedefs, bumpTypedefVersion} from './registerTypedef.js';
const warn = () => undefined;
/**
 * Drops a typedef registration the test added.
 * @param {string} name - The registered name.
 */
function dropTypedef(name) {
  delete typedefs[name];
  bumpTypedefVersion();
}
// A stable node (from the substituted cache or a registry walk) returns the
// very same instance on every call, so downstream identity caches keep
// hitting instead of re-deriving per check.
function testStableNodeReturnsSameInstance() {
  registerTypedef('StableBox', {type: 'object', properties: {v: 'T'}}, ['T']);
  try {
    const node = {type: 'reference', name: 'StableBox', args: ['number']};
    const a = instantiateReference(node, warn);
    const b = instantiateReference(node, warn);
    return a === b && a.properties.v === 'number';
  } finally {
    dropTypedef('StableBox');
  }
}
// An unknown name instantiates nothing: the caller sees undefined and can
// report `unchecked` instead of validating against a phantom type.
function testMissingTypedefReturnsUndefined() {
  return instantiateReference({type: 'reference', name: 'UnregisteredBox', args: ['number']}, warn) === undefined;
}
// Without template parameters or arguments there is nothing to substitute:
// the registry object itself comes back by identity, uncloned.
function testNoArgsReturnsRegistryEntry() {
  registerTypedef('PlainBox', {type: 'object', properties: {n: 'number'}});
  try {
    return instantiateReference({type: 'reference', name: 'PlainBox', args: []}, warn) === typedefs.PlainBox;
  } finally {
    dropTypedef('PlainBox');
  }
}
// Cached instances are shared by every check of the site: a future
// in-place mutator must throw instead of silently corrupting all callers.
function testInstanceFrozen() {
  registerTypedef('FrozenBox', {type: 'object', properties: {v: 'T'}}, ['T']);
  try {
    const inst = instantiateReference({type: 'reference', name: 'FrozenBox', args: ['number']}, warn);
    let loud = false;
    try {
      inst.properties.v = 'string';
    } catch {
      loud = true;
    }
    return Object.isFrozen(inst) && loud && inst.properties.v === 'number';
  } finally {
    dropTypedef('FrozenBox');
  }
}
// Fewer arguments than parameters fill the remainder with `any`, matching
// TypeScript's missing-type-argument behavior; extra arguments are ignored.
function testArgFillMatchesTypeScript() {
  registerTypedef('TwoParamBox', {type: 'object', properties: {a: 'T', b: 'U'}}, ['T', 'U']);
  try {
    const missing = instantiateReference({type: 'reference', name: 'TwoParamBox', args: ['number']}, warn);
    const extra = instantiateReference({type: 'reference', name: 'TwoParamBox', args: ['number', 'string', 'boolean']}, warn);
    return missing.properties.a === 'number' && missing.properties.b === 'any' &&
      extra.properties.a === 'number' && extra.properties.b === 'string';
  } finally {
    dropTypedef('TwoParamBox');
  }
}
// Unserializable arguments (functions have no stable key) skip the cache
// instead of sharing wrongly: each call still substitutes correctly, just
// into a fresh object.
function testUnserializableArgsSkipCache() {
  registerTypedef('FunctionBox', {type: 'object', properties: {v: 'T'}}, ['T']);
  try {
    const fn = () => {};
    const a = instantiateReference({type: 'reference', name: 'FunctionBox', args: [fn]}, warn);
    const b = instantiateReference({type: 'reference', name: 'FunctionBox', args: [fn]}, warn);
    return a !== b && a.properties.v === fn && b.properties.v === fn;
  } finally {
    dropTypedef('FunctionBox');
  }
}
export const tests = [
  testStableNodeReturnsSameInstance,
  testMissingTypedefReturnsUndefined,
  testNoArgsReturnsRegistryEntry,
  testInstanceFrozen,
  testArgFillMatchesTypeScript,
  testUnserializableArgsSkipCache,
];
