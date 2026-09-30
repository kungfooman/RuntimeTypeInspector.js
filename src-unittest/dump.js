/**
 * Dumps all text reachable from a fake node: text nodes, `textContent`
 * props and stored `innerHTML` markup (where `DisplayAnything` writes).
 * @param {*} node - Fake node, text node or string.
 * @returns {string} Concatenated text.
 */
function dump(node) {
  if (node === undefined || node === null) {
    return '';
  }
  if (typeof node === 'string') {
    return node;
  }
  let out = node.text ?? '';
  if (typeof node.textContent === 'string') {
    out += node.textContent;
  }
  if (typeof node.html === 'string') {
    out += node.html;
  }
  for (const child of node.children ?? []) {
    out += dump(child);
  }
  return out;
}
export {dump};
