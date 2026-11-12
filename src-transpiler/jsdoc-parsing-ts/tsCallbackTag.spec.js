import {tsCallbackTag} from './tsCallbackTag.js';
// A callback nests its rows in the signature; the schema carries them
// as an entry with the same parameter shape, not as flat rows.
function testCallbackNestsRows() {
  const tag = {
    fullName: {getText: () => 'SwapFunction'},
    typeExpression: {
      parameters: [{
        name: {getText: () => 'newState'},
        isBracketed: false,
        typeExpression: {getText: () => '{Object}'},
      }],
    },
  };
  const actual = tsCallbackTag(tag);
  return actual.name === 'SwapFunction' && actual.params.length === 1 && actual.params[0].name === 'newState';
}
// A signature return is visible on the tag's typeExpression as its own
// nested row shape; the helper only lowers params (the return binds at
// the document level in `docReaderTS`, mirroring the depfree flat
// `@returns` row), so a signature carrying a return still lowers its
// params here and never throws on the extra node.
function testCallbackIgnoresSignatureReturn() {
  const tag = {
    fullName: {getText: () => 'HandleEventCallback'},
    typeExpression: {
      parameters: [{
        name: {getText: () => 'arg1'},
        isBracketed: true,
        typeExpression: {getText: () => '{any}'},
      }],
      type: {typeExpression: {getText: () => '{void}'}},
    },
  };
  const actual = tsCallbackTag(tag);
  return actual.name === 'HandleEventCallback' && actual.params.length === 1 && actual.params[0].name === 'arg1';
}
export const tests = [testCallbackNestsRows, testCallbackIgnoresSignatureReturn];
