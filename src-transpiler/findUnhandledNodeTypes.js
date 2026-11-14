import {parse        } from '@babel/parser';
import {parserOptions} from './parserOptions.js';
import {Asserter     } from './Asserter.js';
import {expandType   } from './expandType.js';
/**
 * Collects every Babel node type the parser produces for `src`.
 * @param {string} src - Source code to parse.
 * @returns {Set<string>} The produced node types.
 */
function producedNodeTypes(src) {
  const found = new Set();
  const walk = (node) => {
    if (!node || typeof node !== 'object') {
      return;
    }
    if (typeof node.type === 'string') {
      found.add(node.type);
    }
    for (const key of Object.keys(node)) {
      if (key === 'loc' || key === 'start' || key === 'end' || key === 'leadingComments' || key === 'trailingComments' || key === 'innerComments' || key === 'extra') {
        continue;
      }
      const value = node[key];
      if (Array.isArray(value)) {
        for (const entry of value) {
          walk(entry);
        }
      } else {
        walk(value);
      }
    }
  };
  walk(parse(src, parserOptions));
  return found;
}
/**
 * Renders `src` through the real pipeline and reports the first node type
 * that degrades into an `rtiUnhandled` placeholder, if any.
 * @param {string} src - Source code to convert.
 * @returns {string|null} The unhandled node type or `null`.
 */
function unhandledNodeType(src) {
  const asserter = new Asserter({
    expandType,
    addHeader: false,
    filename: 'test.js',
  });
  const out = asserter.toSource(parse(src, parserOptions));
  const match = out.match(/rtiUnhandled\("([A-Za-z0-9]+)"\)/);
  return match ? match[1] : null;
}
export {producedNodeTypes, unhandledNodeType};
