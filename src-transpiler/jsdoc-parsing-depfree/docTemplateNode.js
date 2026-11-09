/**
 * Lowers one template node to the shared schema row: the head splits
 * into binding name and `= default`, the brace text is the constraint.
 * @example
 * docTemplateNode({typeRaw: 'string', headRaw: 'K'});
 * // {name: 'K', constraint: 'string', default: ''}
 * @example
 * docTemplateNode({typeRaw: 'string', headRaw: '[K=string]'});
 * // {name: 'K', constraint: 'string', default: 'string'}
 * @param {{typeRaw: string, headRaw: string}} node - Raw tag node.
 * @returns {{name: string, constraint: string, default: string}} Canonical template.
 */
function docTemplateNode(node) {
  const head = node.headRaw.trim().split(/\s+/)[0] ?? '';
  const match = head.match(/^\[([A-Za-z_$][\w$]*)(?:=(.*))?\]$/);
  if (match) {
    return {name: match[1], constraint: node.typeRaw, default: (match[2] ?? '').trim()};
  }
  return {name: head, constraint: node.typeRaw, default: ''};
}
export {docTemplateNode};
