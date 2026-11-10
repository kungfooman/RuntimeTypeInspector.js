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

// The svelte cast tail strips its orphan `;`: the brace group owns the
// clause extent, and the `;` is statement text on both sides (the TS
// reader strips it at the tag boundary; `readUnbracedType` reads the
// same on the depfree side).
function testCastTailStaysOut() {
  const actual = stripTsBraces('HTMLElement & { object: { test: true }; }');
  return actual === 'HTMLElement & { object: { test: true } }';
}

// tsc's recovery tail on an unclosed object re-balances to the balanced
// brace type: `stripTsBraces` closes the clause the same way the depfree
// `readUnbracedType` recovery path does.
function testRecoveryTailRebalances() {
  const actual = stripTsBraces('HTMLElement & { object: { test: true }; ');
  return actual === 'HTMLElement & { object: { test: true } }';
}

export const tests = [testFullBracesUnwrap, testUnterminatedKeepsInner, testCastTailStaysOut, testRecoveryTailRebalances];
