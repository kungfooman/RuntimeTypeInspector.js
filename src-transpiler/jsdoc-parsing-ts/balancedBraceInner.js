/**
 * Reads the first balanced `{...}` group out of tag source: the inner
 * text plus the index just past the closing brace, or null when no group
 * opens or it never closes. Depth-counted, so nested generics read whole;
 * callers fall back to TS-parsed text on null (current behavior, never a
 * crash).
 * @example
 * balancedBraceInner('@param {Array<X~Y>} x');
 * // {text: 'Array<X~Y>', end: 19}
 * @example
 * balancedBraceInner('@param {number');
 * // null
 * @param {string} source - Tag source text.
 * @returns {{text: string, end: number}|null} Inner text and end index, or null.
 */
function balancedBraceInner(source) {
  const open = source.indexOf('{');
  if (open === -1) {
    return null;
  }
  let depth = 0;
  for (let index = open; index < source.length; index += 1) {
    if (source[index] === '{') {
      depth += 1;
    } else if (source[index] === '}') {
      depth -= 1;
      if (depth === 0) {
        return {
          text: source.slice(open + 1, index),
          end: index + 1,
        };
      }
    }
  }
  return null;
}
export {balancedBraceInner};
