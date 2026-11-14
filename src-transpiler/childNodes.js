import {VISITOR_KEYS} from '@babel/types';
/**
 * Direct child nodes of a Babel node, using Babel's own `VISITOR_KEYS`
 * table so new syntax is traversed with no table update.
 * @example
 * childNodes(parse('class Vec3 { static { run(); } }', parserOptions)
 *   .program.body[0].body.body[0]).map((child) => child.type);
 * @param {*} node - The Babel AST node to inspect.
 * @returns {object[]} Direct child nodes in Babel's key order.
 */
function childNodes(node) {
  const found = [];
  const keys = node && typeof node === 'object' ? VISITOR_KEYS[node.type] : undefined;
  if (keys === undefined) {
    console.warn('childNodes: unknown node type, update @babel/types:', node?.type);
    return found;
  }
  for (const key of keys) {
    const value = node[key];
    if (Array.isArray(value)) {
      for (const entry of value) {
        if (entry && typeof entry === 'object' && typeof entry.type === 'string') {
          found.push(entry);
        }
      }
    } else if (value && typeof value === 'object' && typeof value.type === 'string') {
      found.push(value);
    }
  }
  return found;
}
export {childNodes};
