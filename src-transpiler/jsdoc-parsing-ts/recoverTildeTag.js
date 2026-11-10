import {balancedBraceInner} from './balancedBraceInner.js';

/**
 * Recovers a tag's raw type and head when tsc truncated the type at a
 * jsdoc inner-scope `~` (`Array<Raycaster~Intersection>` parses as
 * `Array<Raycaster` plus an empty name). tsc has no `~` in type position
 * while jsdoc (and the depfree reader) keeps the raw text, so recovery
 * re-slices the tag's own source: when the raw brace continues the
 * truncated text with `~`, the row reads depfree-faithfully. Anything
 * else returns null and callers keep TS-parsed values, so behavior off
 * tilde never changes. RTI reads JSDoc first and tsc second: the TS
 * reader recovers the jsdoc spelling instead of parroting the truncation.
 * @example
 * recoverTildeTag('@param {Array<X~Y>} x', 'Array<X');
 * // {typeRaw: 'Array<X~Y>', headRaw: 'x'}
 * @example
 * recoverTildeTag('@param {number} x', 'number');
 * // null
 * @param {string|undefined} source - Full tag source text (`tag.getText()`).
 * @param {string} truncated - TS-parsed brace-inner text.
 * @returns {{typeRaw: string, headRaw: string}|null} Raw row parts, or null.
 */
function recoverTildeTag(source, truncated) {
  if (typeof source !== 'string' || truncated === '') {
    return null;
  }
  const group = balancedBraceInner(source);
  if (group === null || group.text === truncated) {
    return null;
  }
  if (group.text.startsWith(truncated) === false || group.text[truncated.length] !== '~') {
    return null;
  }
  return {typeRaw: group.text, headRaw: source.slice(group.end).trim()};
}
export {recoverTildeTag};
