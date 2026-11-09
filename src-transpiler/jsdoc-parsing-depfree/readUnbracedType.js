/**
 * Reads an unbraced `@type` clause: the head word tsc binds plus the
 * `&`/`|` chain it reparses after it. tsc owns the boundary: the clause
 * holds type tokens (`&`, `|`, words, parenthesized and generic members,
 * one balanced `{...}`), and the first token that cannot continue it
 * starts the comment (`Foo & Bar some prose` binds `Foo & Bar`). The
 * line ends the clause (a newline splits type from comment even inside
 * braces). The clause strips its orphan `;` exactly like `stripTsBraces`
 * when the braces balance without it (the svelte cast `...; }` is closed
 * text with a statement tail, not recovery), and re-balances the same
 * way when they do not. A word with no clause reads alone; anything else
 * (a leading `-`, a digit, a quote) binds nothing, matching tsc which
 * parses no type there.
 * @example
 * readUnbracedType('HTMLElement & { object: { test: true }; } ');
 * // 'HTMLElement & { object: { test: true } }'
 * @example
 * readUnbracedType('Foo & Bar some prose here ');
 * // 'Foo & Bar'
 * @example
 * readUnbracedType('Expression ');
 * // 'Expression'
 * @param {string} headRaw - Head text after `@type`, one line.
 * @returns {string} Type text, or '' when tsc binds nothing.
 */
function readUnbracedType(headRaw) {
  const line = headRaw.split('\n')[0] ?? '';
  const word = line.match(/^\s*([A-Za-z_$][\w$]*)/);
  if (word === null) {
    return '';
  }
  let out = word[1];
  let rest = line.slice(word[0].length);
  // Braced heads slice differently by caller: `sliceHead` trims the cast
  // tail's outer ` }` (the head ends at the object's own `}`), while the
  // lone-`@type` fallback passes the raw line through. The strip below
  // covers both: the node path Strips through the tail match (a bare `;`
  // with nothing after it), and the trailing-prose path strips here — a
  // `; }` followed by prose is still the cast shape, since a continued
  // clause after the object is not tsc's shape either way.
  const castTail = rest.match(/^(.*\})\s*;\s*(\}\s*)?$/);
  if (castTail) {
    rest = castTail[1] + ' }';
  }
  const castProse = rest.match(/^(.*\})\s*;\s*\}\s+(?=[A-Za-z_$])/);
  if (castProse) {
    rest = castProse[1] + ' } ' + rest.slice(castProse[0].length);
  }
  // A generic head binds whole: without it the member match below stops
  // at the word and the `<...>` tail never chains. tsc prints the
  // arguments spaced (`Array<string>`), so the head carries them raw
  // here; only the operator joins below normalize spacing.
  const genericHead = rest.match(/^\s*(<[^<>\n]*>)/);
  if (genericHead !== null) {
    out += genericHead[1];
    rest = rest.slice(genericHead[0].length);
  }
  for (;;) {
    const operator = rest.match(/^\s*([&|])\s*/);
    if (operator === null) {
      break;
    }
    const after = rest.slice(operator[0].length);
    const member = after.match(/^[A-Za-z_$][\w$]*/);
    const generic = after.match(/^[A-Za-z_$][\w$]*\s*(<[^<>\n]*>)/);
    const paren = after.match(/^(\([^()\n]*\))/);
    if (generic !== null) {
      out += ' ' + operator[1] + ' ' + generic[0].replace(/\s+/, '');
      rest = after.slice(generic[0].length);
      continue;
    }
    if (member !== null && /^\s*\{/.test(after.slice(member[0].length)) === false) {
      out += ' ' + operator[1] + ' ' + member[0];
      rest = after.slice(member[0].length);
      continue;
    }
    if (paren !== null) {
      out += ' ' + operator[1] + ' ' + paren[1];
      rest = after.slice(paren[0].length);
      continue;
    }
    // tsc's own text is the contract: `stripTsBraces` unwraps the brace
    // group — stripping the cast tail's orphan `;` when the braces
    // balance without it (the svelte shape `...; }` is closed text with
    // a statement tail, not recovery) and re-balancing the recovery tail
    // when they do not — so the depfree side reads the same both ways.
    // A brace-group tail ends the clause: tsc keeps the object (splitting
    // trailing prose into the comment) but never continues the clause
    // past it, so the read keeps the stripped object and stops. An
    // unclosed object breaks the clause (the member regex cannot continue
    // it), so the read ends before the operator.
    const tail = after.match(/^\s*(\{(?:[^{}]|\{[^{}]*\})*\})(;?)([\s\S]*)$/);
    if (tail === null) {
      // No balanced object: the orphan `;` is tsc's recovery tail on an
      // unclosed clause, so the read gains its ` }` exactly like
      // `stripTsBraces`.
      const recovery = after.match(/^\s*(\{[\s\S]*?)\s*;\s*$/);
      if (recovery === null) {
        break;
      }
      out += ' ' + operator[1] + ' ' + recovery[1] + ' }';
      break;
    }
    // The orphan `;` is statement text on a closed clause (the svelte
    // cast tail `...; }` the head pre-strip dropped): the depfree side
    // reads the same as `stripTsBraces`.
    const stripped = tail[1];
    const afterTail = tail[3].replace(/;\s*\}?\s*$/, '').trim();
    if (afterTail !== '' && /^[A-Za-z_$]/.test(afterTail)) {
      // Trailing prose the head sliced in: keep the stripped object
      // (tsc splits the comment there while keeping the object).
      out += ' ' + operator[1] + ' ' + stripped;
      break;
    }
    if (afterTail !== '') {
      break;
    }
    out += ' ' + operator[1] + ' ' + stripped;
    break;
  }
  return out;
}
export {readUnbracedType};
