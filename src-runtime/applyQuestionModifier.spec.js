import {applyQuestionModifier} from './applyQuestionModifier.js';
import {registerTypedef, typedefs, bumpTypedefVersion} from './registerTypedef.js';
// We want: stripping `-?` off a registry alias to return a fresh object
// without the flag while the registered typedef keeps it, so later checks
// still see the optional spelling.
function testStripCopiesRegistryAlias() {
  registerTypedef('RtiOpt', {type: 'object', properties: {v: 'number'}, optional: true});
  try {
    const stripped = applyQuestionModifier('RtiOpt', '-');
    return stripped !== typedefs.RtiOpt && typeof stripped === 'object' && stripped !== null &&
      !('optional' in stripped) && typedefs.RtiOpt.optional === true;
  } finally {
    delete typedefs.RtiOpt;
    bumpTypedefVersion();
  }
}
// We want: no flag to strip to keep reference identity, because expanding
// an alias unconditionally breaks structural comparisons like `IfEquals`,
// which must see the same spelling on both sides.
function testNoFlagKeepsIdentity() {
  registerTypedef('RtiReq', {type: 'object', properties: {v: 'number'}});
  try {
    const plain = {type: 'object', properties: {}};
    return applyQuestionModifier('RtiReq', '-') === 'RtiReq' &&
      applyQuestionModifier(plain, '-') === plain;
  } finally {
    delete typedefs.RtiReq;
    bumpTypedefVersion();
  }
}
const tests = [
  testStripCopiesRegistryAlias,
  testNoFlagKeepsIdentity,
];
export {tests};
