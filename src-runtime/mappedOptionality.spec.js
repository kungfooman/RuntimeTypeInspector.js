import {registerTypedef} from './registerTypedef.js';
import {expandType} from '../src-transpiler/expandType.js';
import {createType} from './createType.js';
import {createTypeFromIndexedAccess} from './createTypeFromIndexedAccess.js';
import {validateType} from './validateType.js';
import {explainMismatch} from './explainMismatch.js';
import {validators} from './validators.js';
import {typedefs, typedefTemplates} from './registerTypedef.js';
function clearTypedefs() {
  Object.keys(typedefs).forEach((_) => delete typedefs[_]);
  Object.keys(typedefTemplates).forEach((_) => delete typedefTemplates[_]);
}
function prepare() {
  clearTypedefs();
  registerTypedef('Full', expandType('{count: number, pos: string}'));
  registerTypedef('Over', {type: 'object', properties: {
    pos: {type: 'union', members: ['string', {type: 'array', elementType: 'number'}], optional: true}
  }});
  registerTypedef('Merged', expandType('Omit<Partial<Full>, keyof Over> & Over'));
  registerTypedef('Mapped', expandType('{[P in keyof Merged]: Merged[P]}'));
  registerTypedef('Strict', expandType('Omit<Full, keyof Over> & Over'));
  registerTypedef('StrictMapped', expandType('{[P in keyof Strict]: Strict[P]}'));
}
const warn = () => undefined;
function testSingleUnwrapKeepsFlags() {
  // Single-member indexed access returns the member itself, flags intact.
  prepare();
  const created = createTypeFromIndexedAccess(expandType('Merged["pos"]'), warn);
  return created && created.type === 'union' && created.optional === true &&
    JSON.stringify(created.members) === JSON.stringify(['string', {type: 'array', elementType: 'number'}]);
}
function testMultiStaysUnion() {
  // Multi-key select stays a union wrapper like before.
  prepare();
  const created = createTypeFromIndexedAccess({type: 'indexedAccess', index: {type: 'union', members: ['"count"', '"pos"']}, object: 'Merged'}, warn);
  return created && created.type === 'union' && created.optional === false;
}
function testUnresolvableStaysUndefined() {
  // Unknown bases still fail closed without throwing.
  prepare();
  return createTypeFromIndexedAccess(expandType('Nope["a"]'), warn) === undefined;
}
function testMaterializedKeepsOptional() {
  // Homomorphic props over a Partial base materialize optional.
  prepare();
  const mapped = createType(expandType('{[P in keyof Merged]: Merged[P]}'), warn);
  const props = mapped && mapped.properties;
  return !!props && props.count && props.count.optional === true &&
    props.pos && props.pos.optional === true;
}
function testMaterializedKeepsRequired() {
  // Same chain without Partial stays required, while the optional override
  // keeps its own flag: each source contributes its own optionality.
  prepare();
  const mapped = createType(expandType('{[P in keyof Strict]: Strict[P]}'), warn);
  const props = mapped && mapped.properties;
  return !!props && !props.count.optional && props.pos.optional === true;
}
function testAbsentOptionalsPass() {
  // Partial data validates and explains clean: no false missing findings.
  prepare();
  const mapped = createType(expandType('{[P in keyof Merged]: Merged[P]}'), warn);
  if (validateType({}, mapped, 'loc', 'name', true, warn, 0) !== true) {
    return false;
  }
  const result = explainMismatch({}, mapped, 'name');
  const findings = Array.isArray(result) ? result : result.findings;
  return findings.length === 0;
}
function testAbsentRequiredStillWarns() {
  // A missing required prop still fails and still reports missing.
  prepare();
  const mapped = createType(expandType('{[P in keyof Strict]: Strict[P]}'), warn);
  if (validateType({}, mapped, 'loc', 'name', true, warn, 0) !== false) {
    return false;
  }
  const result = explainMismatch({}, mapped, 'name');
  const findings = Array.isArray(result) ? result : result.findings;
  return findings.some((finding) => finding.kind === 'missing' && finding.path === 'name.count');
}
function testPresentUnionsPass() {
  // Override unions validate through the materialized map, both members.
  prepare();
  const mapped = createType(expandType('{[P in keyof Merged]: Merged[P]}'), warn);
  return validateType({pos: [1, 2]}, mapped, 'loc', 'name', true, warn, 0) === true &&
    validateType({pos: 'x', count: 1}, mapped, 'loc', 'name', true, warn, 0) === true &&
    validateType({pos: true}, mapped, 'loc', 'name', true, warn, 0) === false;
}
function testTableFallback() {
  // Without the table entry the eager probe stays out: props stay lazy.
  prepare();
  const prev = validators.createTypeFromIndexedAccess;
  try {
    delete validators.createTypeFromIndexedAccess;
    const mapped = createType(expandType('{[P in keyof Merged]: Merged[P]}'), warn);
    const props = mapped && mapped.properties;
    return !!props && props.count && props.count.type === 'indexedAccess';
  } finally {
    validators.createTypeFromIndexedAccess = prev;
  }
}
const tests = [
  testSingleUnwrapKeepsFlags,
  testMultiStaysUnion,
  testUnresolvableStaysUndefined,
  testMaterializedKeepsOptional,
  testMaterializedKeepsRequired,
  testAbsentOptionalsPass,
  testAbsentRequiredStillWarns,
  testPresentUnionsPass,
  testTableFallback,
];
export {tests};
