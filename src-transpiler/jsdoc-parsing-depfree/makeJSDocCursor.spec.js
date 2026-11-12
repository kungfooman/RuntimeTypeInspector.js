import {makeJSDocCursor} from './makeJSDocCursor.js';
// The cursor starts at the first token with nothing consumed.
function testCursorStartsAtZero() {
  const cursor = makeJSDocCursor('@param {number} x');
  return cursor.index === 0 && cursor.consumedUpTo === 0 && cursor.src === '@param {number} x';
}
// The cursor carries the lexer's tokens, ending with eof.
function testCursorCarriesTokens() {
  const cursor = makeJSDocCursor('@param {number} x');
  const kinds = cursor.tokens.map((token) => token.kind);
  return cursor.tokens.length > 0 && cursor.tokens[cursor.tokens.length - 1].kind === 'eof' && kinds.includes('tag');
}
export const tests = [
  testCursorStartsAtZero,
  testCursorCarriesTokens,
];
