/**
 * Unwraps one TS brace-text node to its inner text: strips one leading
 * `{` and one trailing `}`. Tolerates tsc's recovery tail: an unbraced
 * type tag reparses the class word with a trailing `& {...}` clause into
 * an intersection whose empty side prints as a trailing `;`, so the raw
 * tail is re-balanced to the balanced brace type. Unterminated text like
 * `{number` strips exactly like the depfree brace parser, which keeps the
 * head word for binding instead of failing the tag.
 * @example
 * stripTsBraces('{number}'); // 'number'
 * @example
 * stripTsBraces('{number'); // 'number'
 * @example
 * stripTsBraces('HTMLElement & { object: { test: true }; ');
 * // 'HTMLElement & { object: { test: true }; }'
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
  if (out.endsWith('; ') || out.endsWith(';')) {
    // tsc's recovery tail: re-balance the trailing clause.
    const tail = out.endsWith('; ') ? out.slice(0, -2) + ' }' : out.slice(0, -1) + '}';
    let depth = 0;
    for (const char of tail) {
      if (char === '{') {
        depth += 1;
      } else if (char === '}') {
        depth -= 1;
      }
    }
    if (depth === 0) {
      return tail;
    }
  }
  return out;
}
export {stripTsBraces};
