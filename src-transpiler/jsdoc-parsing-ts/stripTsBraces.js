/**
 * Unwraps one TS brace-text node to its inner text: strips one leading
 * `{` and one trailing `}`. Tolerates unterminated recovery text like
 * `{number` exactly like the depfree brace parser, which keeps the head
 * word for binding instead of failing the tag.
 * @example
 * stripTsBraces('{number}'); // 'number'
 * @example
 * stripTsBraces('{number'); // 'number'
 * @param {string} text - Raw `getText()` of a TS type expression.
 * @returns {string} Inner brace text.
 */
function stripTsBraces(text) {
  let out = text;
  if (out.startsWith('{')) {
    out = out.slice(1);
  }
  if (out.endsWith('}')) {
    out = out.slice(0, -1);
  }
  return out;
}
export {stripTsBraces};
