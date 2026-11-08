import {isTagToken} from './isTagToken.js';
import {makeJSDocCursor} from './makeJSDocCursor.js';
import {parseBraceType} from './parseBraceType.js';

/**
 * Parses one JSDoc text into raw tag nodes in source order. A cursor owns
 * the source, the token stream, and the read position; each candidate tag
 * reads once through it: braced tags take the balanced `{...}` and the
 * head text after it, bare `@template`/`@callback` tags keep their head
 * word, and marker tags carry nothing.
 *
 * Heads are source slices between the head start and the next stop token
 * (`tag`/`at`/`end`/`eof`/`newline`), cut before the `end` closer's `*`:
 * same-line tags parse as one row each, mid-line prose mentions never open
 * a tag (the lexer already decided `opens`), and a head never spans lines.
 * No furniture is stripped from a head: a `*value` head keeps its star and
 * fails name validation downstream, matching tsc which reads it as an
 * empty name that binds to nothing.
 * @example
 * parseJSDocNodes('@param {number} x');
 * // [{tag: '@param', typeRaw: 'number', headRaw: 'x'}]
 * @param {string} src - JSDoc comment or overload section text.
 * @returns {{tag: string, typeRaw: string, headRaw: string}[]} Raw tag nodes.
 */
// Tags whose type lives in braces. Module-level so every parse shares one
// set instead of allocating per call.
const braceTags = new Set(['@param', '@template', '@type', '@typedef', '@property']);
// Token kinds that end a head slice.
const headStops = new Set(['tag', 'at', 'end', 'eof', 'newline']);
/**
 * Slices the head after a tag: the trimmed source between `start` and the
 * next stop token. The slice itself still reads `src` (heads are free
 * text, not grammar), but both bounds come from tokens the lexer placed:
 * no regex re-decides where the head ends.
 * @param {object} cursor - Cursor to read from and advance.
 * @param {number} start - Source offset the head starts at.
 * @returns {string} Trimmed head.
 */
function sliceHead(cursor, start) {
  let next = cursor.index;
  while (next < cursor.tokens.length && !headStops.has(cursor.tokens[next].kind)) {
    next += 1;
  }
  const stop = next < cursor.tokens.length ? cursor.tokens[next].pos : cursor.src.length;
  let end = stop;
  if (next < cursor.tokens.length && cursor.tokens[next].kind === 'end') {
    end = stop - 1;
  }
  const headRaw = cursor.src.slice(start, Math.max(start, end)).trim();
  cursor.index = next;
  if (next < cursor.tokens.length) {
    cursor.consumedUpTo = cursor.tokens[next].pos;
  } else {
    cursor.consumedUpTo = cursor.src.length;
  }
  return headRaw;
}
function parseJSDocNodes(src) {
  const cursor = makeJSDocCursor(src);
  /** @type {{tag: string, typeRaw: string, headRaw: string}[]} */
  const tags = [];
  while (cursor.index < cursor.tokens.length) {
    const token = cursor.tokens[cursor.index];
    if (token.kind !== 'tag' || !isTagToken(cursor)) {
      cursor.index += 1;
      continue;
    }
    const tag = token.value ?? '';
    if (braceTags.has(tag)) {
      // Only the brace right after the tag (trivia aside, same line)
      // opens the type: `* @param Object [kwargs={}]` has no brace type,
      // and the head's `[kwargs={}]` keeps its own brackets. Trivia rides
      // the token stream, so adjacency is decidable without re-slicing
      // source: only spaces/stars may sit between tag and brace, and no
      // newline may.
      let look = cursor.index + 1;
      while (look < cursor.tokens.length && (cursor.tokens[look].kind === 'space' || cursor.tokens[look].kind === 'stars')) {
        look += 1;
      }
      if (look < cursor.tokens.length && cursor.tokens[look].kind === 'lbrace') {
        cursor.index = look;
        const {typeRaw, headStart} = parseBraceType(cursor);
        tags.push({tag, typeRaw, headRaw: sliceHead(cursor, headStart)});
        continue;
      }
      if (tag === '@template') {
        // Skip the tag token first: sliceHead stops at tags, so starting
        // on it would read an empty head and never advance.
        cursor.index += 1;
        const headRaw = sliceHead(cursor, token.end ?? token.pos);
        const head = headRaw.split(/\s+/)[0] ?? '';
        tags.push({tag, typeRaw: '', headRaw: head});
        continue;
      }
      cursor.index += 1;
      continue;
    }
    if (tag === '@callback' || tag === '@template') {
      // Skip the tag token first: sliceHead stops at tags, so starting
      // on it would read an empty head and never advance.
      cursor.index += 1;
      const headRaw = sliceHead(cursor, token.end ?? token.pos);
      const head = headRaw.split(/\s+/)[0] ?? '';
      tags.push({tag, typeRaw: '', headRaw: head});
      continue;
    }
    // Any other tag still takes a brace type when one opens right after
    // it on the same line (mid-line `@returns {T}` after a param): the
    // adjacency rule matches the braceTags path, only spaces/stars may
    // sit between tag and brace, and no newline may.
    let look = cursor.index + 1;
    while (look < cursor.tokens.length && (cursor.tokens[look].kind === 'space' || cursor.tokens[look].kind === 'stars')) {
      look += 1;
    }
    if (look < cursor.tokens.length && cursor.tokens[look].kind === 'lbrace') {
      cursor.index = look;
      const {typeRaw, headStart} = parseBraceType(cursor);
      tags.push({tag, typeRaw, headRaw: sliceHead(cursor, headStart)});
      continue;
    }
    tags.push({tag, typeRaw: '', headRaw: ''});
    cursor.index += 1;
  }
  return tags;
}
export {parseJSDocNodes};
