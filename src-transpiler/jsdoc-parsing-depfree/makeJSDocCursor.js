import {lexJSDoc} from './lexJSDoc.js';
/**
 * Makes a cursor over one JSDoc text. The cursor owns the source, the
 * token stream, and the read position. `consumedUpTo` is the source offset
 * a previous head consumed through: it opens same-line follower tags,
 * which the lexer (seeing only furniture) cannot decide alone.
 * @example
 * makeJSDocCursor('@param {number} x');
 * // {src: '@param {number} x', tokens: [...], index: 0, consumedUpTo: 0}
 * @param {string} src - JSDoc comment or overload section text.
 * @returns {{src: string, tokens: {kind: string, value?: string, pos: number, end?: number, opens?: boolean}[], index: number, consumedUpTo: number}} Cursor at the first token.
 */
function makeJSDocCursor(src) {
  return {
    src,
    tokens: lexJSDoc(src),
    index: 0,
    consumedUpTo: 0,
  };
}
export {makeJSDocCursor};
