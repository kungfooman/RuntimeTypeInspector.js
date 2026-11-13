import {isTagToken      } from './isTagToken.js';
import {makeJSDocCursor } from './makeJSDocCursor.js';
import {parseBraceType  } from './parseBraceType.js';
import {readUnbracedType} from './readUnbracedType.js';
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
// Token kinds that end a head slice. `at` stays out: an unknown `@word`
// mention is head text (tsc parses no tag there), so the head runs past
// it — including inside parens, where `(@param bar)` rides along instead
// of truncating the line. Only a known `tag` opens a follower.
const headStops = new Set(['tag', 'end', 'eof', 'newline']);
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
/**
 * Slices a `@template` head: the head runs past tokens `sliceHead` would
 * stop at, to the next `@tag` candidate whose text the lexer tagged (a
 * known tag always carries kind `tag`; `@unknown` mentions carry `at`
 * and ride along as head text), or to the end of its line. Commas
 * separate bindings (`O, P`) and braces nest inside bracketed defaults
 * (`[K=Map<A, B>]`): all of that is content here, closed only by a known
 * tag, a newline, a comment end, or input end. Truncating at a comma would
 * amputate real bindings; the split below owns the commas instead.
 * Stopping before the follower keeps the chain (`@template K @param {K}
 * x` parses both): the follower sits at an offset the head never reaches,
 * so the ordinary tag rule opens it, and prose after the slice can never
 * open one.
 * @param {object} cursor - Cursor to read from and advance.
 * @param {number} start - Source offset the head starts at.
 * @returns {string} Trimmed head.
 */
function sliceTemplateHead(cursor, start) {
  let next = cursor.index;
  let depth = 0;
  while (next < cursor.tokens.length) {
    const {kind} = cursor.tokens[next];
    if (kind === 'paren') {
      if (cursor.tokens[next].value === '(') {
        depth += 1;
      } else if (depth > 0) {
        depth -= 1;
      }
      next += 1;
      continue;
    }
    if (depth === 0 && (kind === 'newline' || kind === 'end' || kind === 'eof')) {
      break;
    }
    if (depth === 0 && kind === 'tag') {
      break;
    }
    if (depth > 0 && (kind === 'newline' || kind === 'end' || kind === 'eof')) {
      break;
    }
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
/**
 * Slices a paren-aware head: like `sliceHead`, except inside one paren
 * group. An `@`-mention inside parens is comment text (tsc parses no tag
 * in `call foo(@param bar)`), so the slice runs past it to the matching
 * `)` instead of truncating there. A known tag after the group still ends
 * the head and re-opens (the mention's own span never opens as a node:
 * only head-start tags do). Nesting counts (a `(` inside the group pushes
 * the match out), and an unclosed group runs to the next known tag or
 * newline instead of eating it: tsc parsed no tag in there either, but
 * the tail past it still binds when it sits outside parens.
 * @param {object} cursor - Cursor to read from and advance.
 * @param {number} start - Source offset the head starts at.
 * @returns {string} Trimmed head.
 */
function sliceParenHead(cursor, start) {
  let next = cursor.index;
  let depth = 0;
  while (next < cursor.tokens.length) {
    const at = cursor.tokens[next];
    if (at.kind === 'paren') {
      if (at.value === '(') {
        depth += 1;
      } else if (depth > 0) {
        depth -= 1;
      }
      next += 1;
      continue;
    }
    if (depth === 0 && headStops.has(at.kind)) {
      break;
    }
    if (depth > 0 && (at.kind === 'newline' || at.kind === 'end' || at.kind === 'eof')) {
      break;
    }
    // A mention inside parens never opens as a node: only head-start tags
    // do. Skip its span without emitting, so the head runs past it to the
    // matching `)` instead of truncating there.
    if (depth > 0 && at.kind === 'tag') {
      next += 1;
      continue;
    }
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
/**
 * Slices a braceless head: like `sliceHead` (same stop set: known tags,
 * comment end, input end, newlines). A braceless head binds its first
 * word as the name, and a prose mention can never be a node, so the head
 * must not smuggle the mention's text in — but `@unknown` mentions must
 * not end the slice either, or the head amputates (`@param [detail]`
 * must read `detail`, and `@foo.com` must ride along). A `{...}` group
 * later in the head rides along too (matter-js swaps the order:
 * `@param ...plugin {Function} The plugins` binds the head's first word
 * as the name and the group as the type). Only a known `tag` ends it:
 * the chain rule decides whether that tag opens, and unknown mentions
 * ride through as head text.
 * @param {object} cursor - Cursor to read from and advance.
 * @param {number} start - Source offset the head starts at.
 * @returns {string} Trimmed head.
 */
function sliceBareHead(cursor, start) {
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
/**
 * Tests whether the cursor's tag token sits inside a paren group: no head
 * ever started there, so the mention opens no node even when the
 * consumed-offset chain reaches it. The group is the nearest unmatched
 * `(` before the token on its line: only paren tokens count, so braces
 * and brackets never confuse the depth.
 * @param {object} cursor - Cursor on the candidate tag token.
 * @returns {boolean} True when the tag sits inside parens.
 */
function isParenMention(cursor) {
  let depth = 0;
  const lineStart = cursor.src.lastIndexOf('\n', cursor.tokens[cursor.index].pos - 1) + 1;
  for (let i = cursor.index - 1; i >= 0; i -= 1) {
    const at = cursor.tokens[i];
    if (at.pos < lineStart) {
      break;
    }
    if (at.kind === 'paren') {
      if (at.value === ')') {
        depth += 1;
      } else if (depth > 0) {
        depth -= 1;
      } else {
        return true;
      }
    }
  }
  return false;
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
    // A mention inside parens opened no head: a `tag` token with no
    // head-start still fails the name check downstream, but the row must
    // not exist at all (tsc parsed no tag there), so skip it before the
    // dispatch below can emit one.
    if (isParenMention(cursor)) {
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
      const skippable = (token) => token.kind === 'space' || token.kind === 'stars';
      while (look < cursor.tokens.length && skippable(cursor.tokens[look])) {
        look += 1;
      }
      if (look < cursor.tokens.length && cursor.tokens[look].kind === 'lbrace') {
        cursor.index = look;
        const {typeRaw, headStart} = parseBraceType(cursor);
        const headReader = tag === '@template' ? sliceTemplateHead : sliceParenHead;
        tags.push({
          tag,
          typeRaw,
          headRaw: headReader(cursor, headStart),
        });
        continue;
      }
      if (tag === '@template') {
        // Bare template heads keep their commas and tags: `@template O, P`
        // binds two names, and `@template {A} K @param` chains into the
        // next row (the same consumed-offset rule as ordinary heads, so
        // prose after the slice can never open a follower). Only the bare
        // path runs to the line end: braced heads sliced above.
        cursor.index += 1;
        const headRaw = sliceTemplateHead(cursor, token.end ?? token.pos);
        tags.push({
          tag,
          typeRaw: '',
          headRaw,
        });
        continue;
      }
      if (tag === '@param') {
        // Braceless `@param` reads through the shared grammar: tsc binds
        // the head's first word as the name and a `{...}` group later in
        // the head as the type (matter-js swaps the order:
        // `@param ...plugin {Function} The plugins`), and carries the
        // rest as prose — so the node keeps the whole head for the
        // grammar to split instead of skipping the row. A braceless head
        // binds its first word as the name; the head ends where the
        // chain's hygiene ends it: an `@`-mention inside prose never
        // opens downstream, and its text can never be a name, so the head
        // stops before it (`* @param {A} a mentions @param vaguely`
        // keeps `a`).
        cursor.index += 1;
        const headRaw = sliceBareHead(cursor, token.end ?? token.pos);
        tags.push({
          tag,
          typeRaw: '',
          headRaw,
        });
        continue;
      }
      if (tag === '@type') {
        // `@type` without braces is the only braceless braceTag the parser
        // keeps: `@typedef`/`@property` without braces describe structure
        // the row schema cannot hold. A braceless `@type` reads the clause
        // tsc reparses after the word (`Foo & Bar`, `A & {...}`), split
        // from trailing prose at the first non-type token. The node keeps
        // both: `typeRaw` is the clause (what `docReaderDepFree` binds),
        // `headRaw` is the full head (what the lone-`@type` fallback
        // re-reads when the node bound nothing).
        cursor.index += 1;
        const headRaw = sliceHead(cursor, token.end ?? token.pos);
        const typeRaw = readUnbracedType(headRaw);
        tags.push({tag, typeRaw, headRaw});
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
      tags.push({
        tag,
        typeRaw: '',
        headRaw: head,
      });
      continue;
    }
    // Any other tag still takes a brace type when one opens right after
    // it on the same line (mid-line `@returns {T}` after a param): the
    // adjacency rule matches the braceTags path, only spaces/stars may
    // sit between tag and brace, and no newline may. The tag carries the
    // chain forward like a slice: a following tag on the same line sits
    // past the consumed offset, so it opens (matching tsc, which attaches
    // it).
    let look = cursor.index + 1;
    const skippable = (token) => token.kind === 'space' || token.kind === 'stars';
    while (look < cursor.tokens.length && skippable(cursor.tokens[look])) {
      look += 1;
    }
    if (look < cursor.tokens.length && cursor.tokens[look].kind === 'lbrace') {
      cursor.index = look;
      const {typeRaw, headStart} = parseBraceType(cursor);
      tags.push({
        tag,
        typeRaw,
        headRaw: sliceHead(cursor, headStart),
      });
      continue;
    }
    const fallback = cursor.tokens[look]?.pos ?? cursor.src.length;
    cursor.consumedUpTo = Math.max(cursor.consumedUpTo, fallback);
    tags.push({
      tag,
      typeRaw: '',
      headRaw: '',
    });
    cursor.index += 1;
  }
  return tags;
}
export {parseJSDocNodes};
