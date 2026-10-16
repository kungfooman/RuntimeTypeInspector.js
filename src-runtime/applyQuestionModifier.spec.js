import {applyQuestionModifier} from './applyQuestionModifier.js';
import {registerTypedef, typedefs, bumpTypedefVersion} from './registerTypedef.js';
// We want: stripping `-?` off a registry alias to return a fresh object
// without the flag while the registered typedef keeps it, so later checks
// still see the optional spelling.
function testStripCopiesRegistryAlias() {
  registerTypedef('OptionalBox', {type: 'object', properties: {v: 'number'}, optional: true});
  try {
    const stripped = applyQuestionModifier('OptionalBox', '-');
    return stripped !== typedefs.OptionalBox && typeof stripped === 'object' && stripped !== null &&
      !('optional' in stripped) && typedefs.OptionalBox.optional === true;
  } finally {
    delete typedefs.OptionalBox;
    bumpTypedefVersion();
  }
}
// We want: no flag to strip to keep reference identity, because expanding
// an alias unconditionally breaks structural comparisons like `IfEquals`,
// which must see the same spelling on both sides.
function testNoFlagKeepsIdentity() {
  registerTypedef('RequiredBox', {type: 'object', properties: {v: 'number'}});
  try {
    const plain = {type: 'object', properties: {}};
    return applyQuestionModifier('RequiredBox', '-') === 'RequiredBox' &&
      applyQuestionModifier(plain, '-') === plain;
  } finally {
    delete typedefs.RequiredBox;
    bumpTypedefVersion();
  }
}
const tests = [
  testStripCopiesRegistryAlias,
  testNoFlagKeepsIdentity,
];
export {tests};
