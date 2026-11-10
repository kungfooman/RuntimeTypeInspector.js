/**
 * Unwraps one TS brace-text node to its inner text: strips one leading
 * `{` and one trailing `}`. Tolerates tsc's recovery tail: an unbraced
 * type tag reparses the class word with a trailing `& {...}` clause into
 * an intersection whose empty side prints as a trailing `;`, so the raw
 * tail is re-balanced to the balanced brace type. Unterminated text like
 * `{number` strips exactly like the depfree brace parser, which keeps the
 * head word for binding instead of failing the tag. A symmetric strip
 * never fires on a function tail: an unbraced `() => void & {...}`
 * reparse is already balanced, so the trailing `}` belongs to the object
 * literal and the arrow's `)` is not a brace to match. The svelte cast
 * tail (`@type A & {...}; }`) has no own rule: its getText ends at the
 * object, and only the depfree statement tail past it carries the `;`.
 * @example
 * stripTsBraces('{number}'); // 'number'
 * @example
 * stripTsBraces('{number'); // 'number'
 * @example
 * stripTsBraces('HTMLElement & { object: { test: true }; ');
 * // 'HTMLElement & { object: { test: true } }'
 * @example
 * stripTsBraces('() => void & { x: number }');
 * // '() => void & { x: number }'
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
  // The svelte cast tail (`@type A & {...};`): the clause is closed and
  // the `;` is statement text, not recovery, so it strips — but only
  // when the braces balance with it off. Without that guard the recovery
  // path below re-balances first (depth 1) and wins.
  const unstripped = out.replace(/;\s*$/, '');
  let balanced = 0;
  for (const char of unstripped) {
    if (char === '{') {
      balanced += 1;
    } else if (char === '}') {
      balanced -= 1;
    }
  }
  if (balanced === 0 && /;\s*$/.test(out)) {
    return unstripped.trimEnd();
  }
  if (out.endsWith('; ') || out.endsWith(';')) {
    // tsc's recovery tail: re-balance the trailing clause. The clause is
    // only a recovery artifact when the braces unbalance without it: an
    // already-balanced tail (a function type meeting an object literal,
    // or an object meeting its statement `;`) keeps its own braces
    // instead of gaining another. Count depth on the text with the
    // trailing `;` off: balanced means the `;` is statement text and
    // strips, unbalanced means the clause needs its ` }`.
    const unstripped = out.replace(/;\s*$/, '');
    let depth = 0;
    for (const char of out) {
      if (char === '{') {
        depth += 1;
      } else if (char === '}') {
        depth -= 1;
      }
    }
    let balanced = 0;
    for (const char of unstripped) {
      if (char === '{') {
        balanced += 1;
      } else if (char === '}') {
        balanced -= 1;
      }
    }
    if (balanced === 0) {
      return unstripped.trimEnd();
    }
    if (depth === 1) {
      const tail = out.endsWith('; ') ? out.slice(0, -2) + ' }' : out.slice(0, -1) + '}';
      return tail;
    }
  }
  return out;
}
export {stripTsBraces};
