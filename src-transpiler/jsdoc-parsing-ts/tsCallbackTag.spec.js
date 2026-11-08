import {tsCallbackTag} from './tsCallbackTag.js';

// A callback nests its rows in the signature; the schema carries them
// as an entry with the same parameter shape, not as flat rows.
function testCallbackNestsRows() {
  const tag = {
    fullName: {getText: () => 'SwapFunction'},
    typeExpression: {
      parameters: [{name: {getText: () => 'newState'}, isBracketed: false, typeExpression: {getText: () => '{Object}'}}],
    },
  };
  const actual = tsCallbackTag(tag);
  return actual.name === 'SwapFunction' && actual.params.length === 1 && actual.params[0].name === 'newState';
}

export const tests = [testCallbackNestsRows];
