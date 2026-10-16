import {createTypeFromMapping} from './createTypeFromMapping.js';
import {registerTypedef, typedefs, bumpTypedefVersion} from './registerTypedef.js';
import {validateType} from './validateType.js';
import {expandType} from '../src-transpiler/expandType.js';
const warn = () => undefined;
/**
 * Drops a typedef registration the test added.
 * @param {string} name - The registered name.
 */
function dropTypedef(name) {
  delete typedefs[name];
  bumpTypedefVersion();
}
// Fresh mapping nodes with equal content share one materialization:
// non-templated sites emit the mapping struct inline, and the per-call key,
// condition and indexed-access derivation only runs once per site.
function testFreshNodesShareMaterialization() {
  const freshNode = () => expandType('{[K in "a"|"b"]: number}');
  const a = createTypeFromMapping(freshNode(), warn);
  const b = createTypeFromMapping(freshNode(), warn);
  return a === b && a.properties.a === 'number' && a.properties.b === 'number';
}
// A stable node (registry typedef or substituted tree) takes the identity
// path and returns the very same materialization on every call.
function testStableNodeReturnsSameMaterialization() {
  const node = expandType('{[K in "a"|"b"]: number}');
  const a = createTypeFromMapping(node, warn);
  const b = createTypeFromMapping(node, warn);
  return a === b && a.properties.a === 'number';
}
// Materializations are shared across checks: in-place mutation must fail
// loudly instead of corrupting every later validation of the site.
function testMaterializationFrozen() {
  const mat = createTypeFromMapping(expandType('{[K in "x"]: number}'), warn);
  let loud = false;
  try {
    mat.properties.x = 'string';
  } catch {
    loud = true;
  }
  return Object.isFrozen(mat) && Object.isFrozen(mat.properties) && loud && mat.properties.x === 'number';
}
// Re-registering the mapped source bumps the registry version: equal
// mapping content must recompute its keys against the new registry instead
// of serving the stale materialization from before the update.
function testRegistryUpdateInvalidates() {
  registerTypedef('MapSource', {type: 'object', properties: {a: 'number'}});
  try {
    const freshNode = () => ({type: 'mapping', iterable: {type: 'keyof', argument: 'MapSource'}, element: 'K', result: 'K'});
    const before = createTypeFromMapping(freshNode(), warn);
    registerTypedef('MapSource', {type: 'object', properties: {a: 'number', b: 'boolean'}});
    const after = createTypeFromMapping(freshNode(), warn);
    return before !== after &&
      before.properties.b === undefined &&
      after.properties.a === '"a"' &&
      after.properties.b === '"b"';
  } finally {
    dropTypedef('MapSource');
  }
}
// A string typedef name resolves to the registry node before caching, so
// repeated calls share the materialization.
function testStringNameResolvesTypedef() {
  registerTypedef('NamedMapping', expandType('{[K in "x"]: number}'));
  try {
    const a = createTypeFromMapping('NamedMapping', warn);
    const b = createTypeFromMapping('NamedMapping', warn);
    return a === b && a.properties.x === 'number';
  } finally {
    dropTypedef('NamedMapping');
  }
}
// Materializing through a registered mapping must not rewrite the registry:
// an inline tuple result with rest elements is registry-shared, and the old
// in-place flattener replaced its elements array on first materialization.
// The registry keeps its exact array afterwards.
function testRegistryTypedefUntouched() {
  registerTypedef('RegistryMapping', {type: 'mapping',
    iterable: {type: 'keyof', argument: {type: 'object', properties: {a: 'number'}}},
    element: 'K',
    result: {type: 'tuple', elements: [
      {type: 'rest', annotation: {type: 'tuple', elements: ['number', 'boolean']}},
      'string',
    ]}});
  try {
    const elementsBefore = typedefs.RegistryMapping.result.elements;
    const mat = createTypeFromMapping('RegistryMapping', warn);
    const untouched = typedefs.RegistryMapping.result.elements === elementsBefore &&
      elementsBefore.length === 2 &&
      elementsBefore[0].type === 'rest';
    const flat = mat.properties.a;
    const desugared = flat.elements.length === 3 && flat.elements[0] === 'number' && flat.elements[2] === 'string';
    return untouched && desugared;
  } finally {
    dropTypedef('RegistryMapping');
  }
}
export const tests = [
  testFreshNodesShareMaterialization,
  testStableNodeReturnsSameMaterialization,
  testMaterializationFrozen,
  testRegistryUpdateInvalidates,
  testStringNameResolvesTypedef,
  testRegistryTypedefUntouched,
];
