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

// tsc's recovery tail on an unbraced class plus clause re-balances to
// the balanced brace type: the depfree side reads the whole clause the
// same way, so the stranded `;` never leaks into the row.
function testRecoveryTailRebalances() {
  const actual = stripTsBraces('HTMLElement & { object: { test: true }; ');
  return actual === 'HTMLElement & { object: { test: true } }';
}

export const tests = [testFullBracesUnwrap, testUnterminatedKeepsInner, testRecoveryTailRebalances];
