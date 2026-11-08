/**
 * Counts unbalanced opening braces, so `@typedef {{...}}` types split
 * across lines can be re-joined before parsing.
 * @param {string} text - Text to scan.
 * @returns {number} Open braces minus close braces.
 * @example
 * braceDepth('{a: {b: 1}'); // 1
 * braceDepth(''); // 0
 */
function braceDepth(text) {
  let depth = 0;
  for (const c of text) {
    if (c === '{') {
      depth++;
    } else if (c === '}') {
      depth--;
    }
  }
  return depth;
}
export {braceDepth};
