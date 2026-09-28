import {genJsx, appendChildren} from './jsx.js';
/**
 * Minimal DOM stub so the JSX base can be tested in Node (no browser).
 * Only implements what genJsx/appendChildren need.
 */
class FakeNode {
  children = [];
  append(...nodes) {
    this.children.push(...nodes);
  }
}
class FakeElement extends FakeNode {
  dataset = {};
  style = {};
  attributes = {};
  constructor(tagname) {
    super();
    this.tagname = tagname;
  }
  setAttribute(key, value) {
    this.attributes[key] = value;
  }
}
class FakeText extends FakeNode {
  constructor(text) {
    super();
    this.text = text;
  }
}
function installFakeDom() {
  const prevDoc = globalThis.document;
  const prevNode = globalThis.Node;
  globalThis.Node = FakeNode;
  globalThis.document = {
    createElement: (tag) => new FakeElement(tag),
    createTextNode: (text) => new FakeText(String(text)),
  };
  return () => {
    if (prevDoc === undefined) {
      delete globalThis.document;
    } else {
      globalThis.document = prevDoc;
    }
    if (prevNode === undefined) {
      delete globalThis.Node;
    } else {
      globalThis.Node = prevNode;
    }
  };
}
const tests = [
  () => {
    const restore = installFakeDom();
    try {
      const Div = genJsx('div');
      const el = Div({className: 'a', dataset: {topping: 'Pepperoni'}, 'data-crust': 'thin'}, 'hi');
      return el.tagname === 'div' && el.className === 'a' && el.dataset.topping === 'Pepperoni' &&
        el.attributes['data-crust'] === 'thin' && el.children.length === 1;
    } finally {
      restore();
    }
  },
  () => {
    const restore = installFakeDom();
    try {
      const Div = genJsx('div');
      const Button = genJsx('button');
      const btn = Button({onclick: () => undefined}, 'x');
      const el = Div({}, btn, ['a', ['b']], null, undefined, false, 1);
      // btn + 'a' + 'b' + 1 => 4 children (nullish/false skipped)
      return el.children.length === 4 && el.children[0] === btn;
    } finally {
      restore();
    }
  },
  () => {
    const restore = installFakeDom();
    try {
      const Input = genJsx('input');
      const el = Input({type: 'checkbox', style: {color: 'red'}});
      return el.type === 'checkbox' && el.style.color === 'red';
    } finally {
      restore();
    }
  },
  () => {
    const restore = installFakeDom();
    try {
      const Div = genJsx('div');
      const parent = Div({});
      appendChildren(parent, []);
      return parent.children.length === 0;
    } finally {
      restore();
    }
  },
];
export {tests};
