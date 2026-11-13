/**
 * Reads a balanced `{...}` type starting at the cursor's `lbrace`. Counts
 * brace tokens from the matching index: the first `rbrace` that balances
 * the depth closes the type, and anything after (including more braces in
 * the head, like `[kwargs={}]`) stays out. Returns the raw inner text and
 * the source offset the head starts at (the closer end). An unclosed brace
 * closes at the comment end: the type runs to the last `end` closer (or
 * input end) and reports unbalanced, matching tsc which recovers
 * `a: number` from `{number a` instead of failing the tag. The caller
 * still sees `balanced: false` and can fail the tag loudly; recovery only
 * keeps following tags parseable. Advances the cursor past the closer (or
 * to the stop token when unbalanced), so the head read chains.
 * @example
 * const cursor = makeJSDocCursor('{number} x');
 * parseBraceType(cursor);
 * // {typeRaw: 'number', balanced: true, headStart: 8}
 * @param {object} cursor - Cursor on the `lbrace` token to read from and advance.
 * @param {string} cursor.src - The full JSDoc text (for slicing raw content).
 * @param {{kind: string, pos: number, end?: number}[]} cursor.tokens - The token stream.
 * @param {number} cursor.index - Index of the `lbrace` token.
 * @param {number} cursor.consumedUpTo - Source offset a previous head consumed through.
 * @returns {{typeRaw: string, balanced: boolean, headStart: number}} Raw type, balance flag, head offset.
 */
function parseBraceType(cursor) {
  const open = cursor.tokens[cursor.index];
  let depth = 1;
  let i = cursor.index + 1;
  let lastEnd = -1;
  while (i < cursor.tokens.length && depth > 0) {
    if (cursor.tokens[i].kind === 'eof') {
      break;
    }
    if (cursor.tokens[i].kind === 'lbrace') {
      depth += 1;
    } else if (cursor.tokens[i].kind === 'rbrace') {
      depth -= 1;
      if (depth === 0) {
        i += 1;
        break;
      }
    } else if (cursor.tokens[i].kind === 'end') {
      lastEnd = i;
    }
    i += 1;
  }
  const balanced = depth === 0;
  if (balanced) {
    const close = cursor.tokens[i - 1];
    const typeRaw = cursor.src.slice(open.pos + 1, close.pos);
    const headStart = close.end ?? close.pos;
    cursor.index = i;
    return {typeRaw, balanced, headStart};
  }
  // Unclosed: recover like tsc. TS parses type-then-name greedily, not by
  // brace matching: the type is the first type-ish word, the head the name
  // after it (`number a` -> type `number`, head `a`), and a following tag
  // still opens its own row. Clip the tail at the next tag/`at`/`end`
  // token first, then split type from head at the first head-word
  // boundary; the raw type keeps the failure visible for the expander.
  let tailEnd = lastEnd !== -1 ? lastEnd : cursor.tokens.length - 1;
  for (let k = cursor.index + 1; k < tailEnd; k++) {
    const {kind} = cursor.tokens[k];
    if (kind === 'tag' || kind === 'at' || kind === 'end') {
      tailEnd = k;
      break;
    }
  }
  const tailToken = cursor.tokens[tailEnd];
  const stop = tailToken.kind === 'eof' ? cursor.src.length : tailToken.pos;
  const tail = cursor.src.slice(open.pos + 1, stop);
  const headMatch = tail.match(/^\s*(\S+?)\s+([A-Za-z_$][\w$]*(?:\.[\w$]+)*)\s*\*?\s*$/);
  if (headMatch && headMatch[1] !== undefined && headMatch[2] !== undefined) {
    const [, typeRaw] = headMatch;
    const [, needle, head] = headMatch;
    const anchor = tail.indexOf(needle) + needle.length;
    const headStart = open.pos + 1 + tail.indexOf(head, anchor);
    cursor.index = tailEnd;
    return {typeRaw, balanced, headStart};
  }
  const typeRaw = tail;
  cursor.index = tailEnd;
  return {
    typeRaw,
    balanced,
    headStart: stop,
  };
}
export {parseBraceType};
