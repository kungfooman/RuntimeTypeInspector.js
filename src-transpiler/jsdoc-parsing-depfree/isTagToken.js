/**
 * Tests whether the cursor's tag token opens a tag node. The lexer
 * already decided the line shape (`opens`); the only thing it cannot see
 * is the parser's own progress, so a previously consumed same-line head
 * (`consumedUpTo`) opens followers on offsets alone. Mid-line prose fails
 * the furniture check in the lexer, so it never reaches the chain.
 * @example
 * const cursor = makeJSDocCursor('* @param {number} x');
 * cursor.index = 0;
 * isTagToken(cursor);
 * // true (only furniture before the tag)
 * @example
 * isTagToken(makeJSDocCursor('just prose'));
 * // false (cursor sits on `eof`, not on a tag)
 * @param {object} cursor - Cursor on the candidate tag token.
 * @param {string} cursor.src - The full JSDoc text.
 * @param {{kind: string, value?: string, pos: number, end?: number, opens?: boolean}[]} cursor.tokens - The token stream.
 * @param {number} cursor.index - Index of the candidate tag token.
 * @param {number} cursor.consumedUpTo - Source offset a previous head consumed through.
 * @returns {boolean} True when the token opens a tag node.
 */
function isTagToken(cursor) {
  const token = cursor.tokens[cursor.index];
  if (token === undefined || token.kind !== 'tag') {
    return false;
  }
  if (token.opens === true) {
    return true;
  }
  if (cursor.consumedUpTo > 0 && token.pos >= cursor.consumedUpTo) {
    return true;
  }
  return false;
}
export {isTagToken};
