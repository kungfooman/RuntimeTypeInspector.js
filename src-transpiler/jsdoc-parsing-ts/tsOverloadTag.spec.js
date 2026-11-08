import {tsOverloadTag} from './tsOverloadTag.js';

// A signature with a return lowers params and return brace text.
function testSignatureLowersParamsAndReturn() {
  const tag = {
    typeExpression: {
      parameters: [{name: {getText: () => 'text'}, isBracketed: false, typeExpression: {getText: () => '{string}'}}],
      type: {typeExpression: {getText: () => '{string}'}},
    },
  };
  const actual = tsOverloadTag(tag);
  return actual.params.length === 1 && actual.params[0].name === 'text' && actual.returns === 'string';
}

// A signature without a return lowers an empty return, not undefined.
function testMissingReturnLowersEmpty() {
  const tag = {
    typeExpression: {
      parameters: [{name: {getText: () => 'x'}, isBracketed: true, typeExpression: {getText: () => '{number}'}}],
      type: undefined,
    },
  };
  const actual = tsOverloadTag(tag);
  return actual.params.length === 1 && actual.params[0].bracketed === true && actual.returns === '';
}

export const tests = [testSignatureLowersParamsAndReturn, testMissingReturnLowersEmpty];
