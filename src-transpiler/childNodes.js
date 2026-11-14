import {VISITOR_KEYS} from '@babel/types';
/**
 * Child keys for `node.type` straight from Babel's own `VISITOR_KEYS`
 * table: the same keys every Babel tool traverses. Comments ride
 * `leadingComments`/`trailingComments`, which the JSDoc reader consumes
 * directly, so they are not child keys here. An empty array is a real
 * Babel verdict (the type is a leaf or comment-adjacent like
 * `InterpreterDirective`); `undefined` means Babel never heard of the
 * type, which the fallback in `childNodes` reports loudly.
 * @param {*} node - The Babel AST node to inspect.
 * @returns {string[]|undefined} Child keys in Babel's order, or `undefined`.
 */
function childKeys(node) {
  if (!node || typeof node !== 'object' || typeof node.type !== 'string') {
    return [];
  }
  return VISITOR_KEYS[node.type];
}
/**
 * Collects the traversable child nodes of any Babel node using Babel's
 * own `VISITOR_KEYS` table. A new Babel version that adds or renames a
 * node type only changes what this returns, never the callers. Comment
 * nodes (`CommentBlock`, `CommentLine`) are leaves: Babel's table holds
 * no keys for them, so they contribute no children here.
 * @example
 * childNodes(parse('class Vec3 { static { run(); } }', parserOptions)
 *   .program.body[0].body.body[0]).map((child) => child.type);
 * @param {*} node - The Babel AST node to inspect.
 * @returns {object[]} Direct child nodes in Babel's key order.
 */
function childNodes(node) {
  const found = [];
  const keys = childKeys(node);
  if (keys === undefined && node && typeof node === 'object' && typeof node.type === 'string') {
    console.warn('childNodes: unknown node type, update @babel/types:', node.type);
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
export {childKeys, childNodes};
