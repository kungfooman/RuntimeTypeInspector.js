import {stripTsBraces} from './stripTsBraces.js';

// A full brace pair unwraps to its inner text.
function testFullBracesUnwrap() {
  return stripTsBraces('{number}') === 'number';
}

// Unterminated recovery text keeps the inner text, like the depfree
// brace parser, which binds the head word instead of failing the tag.
function testUnterminatedKeepsInner() {
  return stripTsBraces('{number') === 'number';
}

export const tests = [testFullBracesUnwrap, testUnterminatedKeepsInner];
