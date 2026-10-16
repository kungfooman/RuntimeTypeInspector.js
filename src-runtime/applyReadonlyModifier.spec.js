import {applyReadonlyModifier} from './applyReadonlyModifier.js';
import {registerTypedef, typedefs, bumpTypedefVersion} from './registerTypedef.js';
// We want: stripping `-readonly` off a registry alias to return a fresh
// object without the flag while the registered typedef keeps it, so later
// checks still see the readonly spelling.
function testStripCopiesRegistryAlias() {
  registerTypedef('RtiRo', {type: 'object', properties: {v: 'number'}, readonly: true});
  try {
    const stripped = applyReadonlyModifier('RtiRo', '-');
    return stripped !== typedefs.RtiRo && typeof stripped === 'object' && stripped !== null &&
      !('readonly' in stripped) && typedefs.RtiRo.readonly === true;
  } finally {
    delete typedefs.RtiRo;
    bumpTypedefVersion();
  }
}
// We want: no flag to strip to keep reference identity, because expanding
// an alias unconditionally breaks structural comparisons like `IfEquals`,
// which must see the same spelling on both sides.
function testNoFlagKeepsIdentity() {
  registerTypedef('RtiRw', {type: 'object', properties: {v: 'number'}});
  try {
    const plain = {type: 'object', properties: {}};
    return applyReadonlyModifier('RtiRw', '-') === 'RtiRw' &&
      applyReadonlyModifier(plain, '-') === plain;
  } finally {
    delete typedefs.RtiRw;
    bumpTypedefVersion();
  }
}
const tests = [
  testStripCopiesRegistryAlias,
  testNoFlagKeepsIdentity,
];
export {tests};
