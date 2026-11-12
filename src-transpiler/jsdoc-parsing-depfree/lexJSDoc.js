/**
 * Lexes one JSDoc text into structural tokens. A single left-to-right char
 * scan emits everything the parser needs, so the parser never re-slices
 * raw source. Like tsc's `scanJsDocToken`, trivia rides the token stream
 * instead of vanishing: whitespace runs, asterisks, and line breaks are
 * tokens the parser skips positionally, so gap adjacency (brace right
 * after a tag, head words before a stop) is decidable from tokens alone.
 * Each token carries its kind, its source offsets, and the decision the
 * lexer already made:
 *
 * - `tag`/`at`: known `@tag` candidates vs unknown `@word` mentions (tag
 *   boundaries mirror the legacy regex `@(param|...) (?![\w$])`: maximal
 *   `@` + word chars must equal a known tag, so `@parametric` is prose).
 *   Only comment furniture (`*`, `/`, whitespace) may precede an opening
 *   tag on its line, or the section marker `@overload`: the lexer marks
 *   `opens: true` only then, so the parser never rechecks line text.
 * - `lbrace`/`rbrace`/`lbracket`/`rbracket`: bracket positions for brace
 *   matching and bracket-name parsing. `equals`/`comma`/`dot`: head
 *   punctuation, so bracket defaults (`[x=1]`) and dotted paths scan as
 *   token runs instead of string splits.
 * - `word`: identifier runs (prose and names alike; the parser classifies
 *   them by position, like tsc's identifier-or-keyword tokens).
 * - `punct`: stray `-`/`/` inside heads (kept so bracket names never
 *   silently glue across them: `[a-b]` stays `a-b` for validation).
 * - `stars`: `*` runs (comment furniture), `end`: comment-end `*\/`,
 *   `newline`: line breaks (heads never span lines), `eof`: input end.
 * @example
 * lexJSDoc('@param {number} x');
 * // [{kind: 'tag', value: '@param', pos: 0, end: 6, opens: true, ...}, ...]
 * @param {string} src - JSDoc comment or overload section text.
 * @returns {{kind: string, value?: string, pos: number, end?: number, opens?: boolean}[]} Tokens in source order, ending with eof.
 */
// Known tags mirror the legacy tagPattern vocabulary. Module-level so
// every scan shares one set instead of allocating per call.
const knownTags = new Set([
  '@param',
  '@template',
  '@type',
  '@return',
  '@returns',
  '@typedef',
  '@property',
  '@callback',
  '@overload',
  '@ignoreRTI',
  '@event',
  '@readonly',
]);
function lexJSDoc(src) {
  const tokens = [];
  const isWord = (c) => c !== undefined && /[\w$]/.test(c);
  const isSpace = (c) => c === ' ' || c === '\t' || c === '\r' || c === '\f' || c === '\v';
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === '*' && src[i + 1] === '/') {
      tokens.push({
        kind: 'end',
        pos: i,
        end: i + 2,
      });
      i += 2;
      continue;
    }
    if (c === '\n') {
      tokens.push({
        kind: 'newline',
        pos: i,
        end: i + 1,
      });
      i += 1;
      continue;
    }
    if (isSpace(c)) {
      let j = i + 1;
      while (j < src.length && isSpace(src[j])) {
        j += 1;
      }
      tokens.push({
        kind: 'space',
        pos: i,
        end: j,
      });
      i = j;
      continue;
    }
    if (c === '*') {
      let j = i + 1;
      while (src[j] === '*') {
        j += 1;
      }
      tokens.push({
        kind: 'stars',
        pos: i,
        end: j,
      });
      i = j;
      continue;
    }
    if (c === '{') {
      tokens.push({
        kind: 'lbrace',
        pos: i,
        end: i + 1,
      });
      i += 1;
      continue;
    }
    if (c === '}') {
      tokens.push({
        kind: 'rbrace',
        pos: i,
        end: i + 1,
      });
      i += 1;
      continue;
    }
    if (c === '[') {
      tokens.push({
        kind: 'lbracket',
        value: '[',
        pos: i,
        end: i + 1,
      });
      i += 1;
      continue;
    }
    if (c === ']') {
      tokens.push({
        kind: 'rbracket',
        value: ']',
        pos: i,
        end: i + 1,
      });
      i += 1;
      continue;
    }
    if (c === '=') {
      tokens.push({
        kind: 'equals',
        pos: i,
        end: i + 1,
      });
      i += 1;
      continue;
    }
    if (c === ',') {
      tokens.push({
        kind: 'comma',
        pos: i,
        end: i + 1,
      });
      i += 1;
      continue;
    }
    if (c === '-' || c === '/') {
      tokens.push({
        kind: 'punct',
        value: c,
        pos: i,
        end: i + 1,
      });
      i += 1;
      continue;
    }
    if (c === '.') {
      let j = i;
      while (src[j] === '.') {
        j += 1;
      }
      tokens.push({
        kind: 'dots',
        value: src.slice(i, j),
        pos: i,
        end: j,
      });
      i = j;
      continue;
    }
    if (c === '(' || c === ')') {
      tokens.push({
        kind: 'paren',
        value: c,
        pos: i,
        end: i + 1,
      });
      i += 1;
      continue;
    }
    if (c === '@') {
      let j = i + 1;
      while (j < src.length && isWord(src[j])) {
        j += 1;
      }
      if (j > i + 1) {
        // The whole tag-open rule, decided here: only furniture before
        // the token on its line, or the `@overload` section marker.
        const lineStart = src.lastIndexOf('\n', i - 1) + 1;
        const before = src.slice(lineStart, i);
        const opens = /^[\s*/]*$/.test(before) || /(?:^|\s)@overload$/.test(before.trim());
        const candidate = src.slice(i, j);
        if (knownTags.has(candidate)) {
          tokens.push({
            kind: 'tag',
            value: candidate,
            pos: i,
            end: j,
            opens,
          });
        } else {
          tokens.push({
            kind: 'at',
            value: candidate,
            pos: i,
            end: j,
            opens,
          });
        }
        i = j;
        continue;
      }
      i += 1;
      continue;
    }
    if (isWord(c)) {
      let j = i + 1;
      while (j < src.length && isWord(src[j])) {
        j += 1;
      }
      tokens.push({
        kind: 'word',
        value: src.slice(i, j),
        pos: i,
        end: j,
      });
      i = j;
      continue;
    }
    i += 1;
  }
  tokens.push({
    kind: 'eof',
    pos: src.length,
    end: src.length,
  });
  return tokens;
}
export {lexJSDoc};
