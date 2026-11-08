/**
 * Separates overload signatures from the implementation documentation.
 * A return tag terminates a signature when another parameter follows it.
 * @param {string[]} blocks - Documentation blocks in source order.
 * @returns {{overloads: string[], impl: string|null}} Signature sections.
 * @example
 * splitOverloadSections(['* @overload @param {number} x', '* @param {any} x']);
 * // {overloads: [' @param {number} x'], impl: '* @param {any} x'}
 */
function splitOverloadSections(blocks) {
  const overloads = [];
  let impl = null;
  for (const block of blocks) {
    const pieces = block.split(/@overload\b/);
    if (pieces.length === 1) {
      if (/@param\b/.test(block)) impl = block;
      continue;
    }
    if (/@param\b/.test(pieces[0])) impl = pieces[0];
    for (const [index, part] of pieces.slice(1).entries()) {
      let piece = part;
      if (index === 0 && /@template\b/.test(pieces[0]) && !/@param\b/.test(pieces[0])) {
        piece = pieces[0] + piece;
      }
      const returnTag = /@returns?\b[^\n@]*/.exec(piece);
      if (returnTag) {
        const end = returnTag.index + returnTag[0].length;
        const after = piece.slice(end);
        if (/@param\b/.test(after)) {
          overloads.push(piece.slice(0, end));
          impl = after;
          continue;
        }
      }
      overloads.push(piece);
    }
  }
  return {overloads, impl};
}
export {splitOverloadSections};
