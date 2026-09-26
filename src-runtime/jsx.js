/**
 * Pure ESM JSX-style DOM helper (see issue #134 item 7).
 *
 * UI IS ALWAYS THE SOURCE-OF-TRUTH: read state from the DOM when gathering
 * data, and append/modify elements directly on DOM nodes. Do NOT mirror UI
 * state in JS variables or state arrays.
 *
 * @example
 * import {genJsx} from './jsx.js';
 * const Div = genJsx('div');
 * const Button = genJsx('button');
 * const panel = Div({className: 'app-container'},
 *   Button({onclick: () => panel.remove()}, 'Close')
 * );
 */
/**
 * @param {string} tagname - The tag to create, e.g. `div`.
 * @returns {(props?: object, ...children: any[]) => HTMLElement} Factory like `Div(props, ...children)`.
 */
function genJsx(tagname) {
  return (props = {}, ...children) => {
    const ret = document.createElement(tagname);
    for (const [key, value] of Object.entries(props)) {
      if (value === undefined || value === null) {
        continue;
      }
      if (key === 'dataset' && typeof value === 'object') {
        Object.assign(ret.dataset, value);
      } else if (key.startsWith('data-')) {
        ret.setAttribute(key, String(value));
      } else if (key === 'style' && typeof value === 'object') {
        Object.assign(ret.style, value);
      } else if (key === 'className') {
        ret.className = String(value);
      } else {
        ret[key] = value;
      }
    }
    appendChildren(ret, children);
    return ret;
  };
}
/**
 * Appends JSX children to a parent node. Strings/numbers become text nodes,
 * nodes are appended directly, arrays are flattened, nullish values skipped.
 * @param {HTMLElement} parent - The node to append to.
 * @param {any[]} children - Nested children.
 */
function appendChildren(parent, children) {
  for (const child of children.flat(Infinity)) {
    if (child === undefined || child === null || child === false) {
      continue;
    }
    if (typeof child === 'string' || typeof child === 'number') {
      parent.append(document.createTextNode(String(child)));
    } else if (child instanceof Node) {
      parent.append(child);
    } else {
      parent.append(document.createTextNode(String(child)));
    }
  }
}
const Div = genJsx('div');
const Span = genJsx('span');
const Button = genJsx('button');
const Input = genJsx('input');
const Select = genJsx('select');
const Option = genJsx('option');
const Table = genJsx('table');
const Tr = genJsx('tr');
const Td = genJsx('td');
const Th = genJsx('th');
const Dialog = genJsx('dialog');
const Pre = genJsx('pre');
export {genJsx, appendChildren, Div, Span, Button, Input, Select, Option, Table, Tr, Td, Th, Dialog, Pre};
