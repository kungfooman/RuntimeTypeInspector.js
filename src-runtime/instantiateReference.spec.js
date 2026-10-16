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
  registerTypedef('RtiStable', {type: 'object', properties: {v: 'T'}}, ['T']);
  try {
    const node = {type: 'reference', name: 'RtiStable', args: ['number']};
    const a = instantiateReference(node, warn);
    const b = instantiateReference(node, warn);
    return a === b && a.properties.v === 'number';
  } finally {
    dropTypedef('RtiStable');
  }
}
// An unknown name instantiates nothing: the caller sees undefined and can
// report `unchecked` instead of validating against a phantom type.
function testMissingTypedefReturnsUndefined() {
  return instantiateReference({type: 'reference', name: 'RtiNeverRegistered', args: ['number']}, warn) === undefined;
}
// Without template parameters or arguments there is nothing to substitute:
// the registry object itself comes back by identity, uncloned.
function testNoArgsReturnsRegistryEntry() {
  registerTypedef('RtiPlain', {type: 'object', properties: {n: 'number'}});
  try {
    return instantiateReference({type: 'reference', name: 'RtiPlain', args: []}, warn) === typedefs.RtiPlain;
  } finally {
    dropTypedef('RtiPlain');
  }
}
// Cached instances are shared by every check of the site: a future
// in-place mutator must throw instead of silently corrupting all callers.
function testInstanceFrozen() {
  registerTypedef('RtiFrz', {type: 'object', properties: {v: 'T'}}, ['T']);
  try {
    const inst = instantiateReference({type: 'reference', name: 'RtiFrz', args: ['number']}, warn);
    let loud = false;
    try {
      inst.properties.v = 'string';
    } catch {
      loud = true;
    }
    return Object.isFrozen(inst) && loud && inst.properties.v === 'number';
  } finally {
    dropTypedef('RtiFrz');
  }
}
// Fewer arguments than parameters fill the remainder with `any`, matching
// TypeScript's missing-type-argument behavior; extra arguments are ignored.
function testArgFillMatchesTypeScript() {
  registerTypedef('RtiTwo', {type: 'object', properties: {a: 'T', b: 'U'}}, ['T', 'U']);
  try {
    const missing = instantiateReference({type: 'reference', name: 'RtiTwo', args: ['number']}, warn);
    const extra = instantiateReference({type: 'reference', name: 'RtiTwo', args: ['number', 'string', 'boolean']}, warn);
    return missing.properties.a === 'number' && missing.properties.b === 'any' &&
      extra.properties.a === 'number' && extra.properties.b === 'string';
  } finally {
    dropTypedef('RtiTwo');
  }
}
export const tests = [
  testStableNodeReturnsSameInstance,
  testMissingTypedefReturnsUndefined,
  testNoArgsReturnsRegistryEntry,
  testInstanceFrozen,
  testArgFillMatchesTypeScript,
];
