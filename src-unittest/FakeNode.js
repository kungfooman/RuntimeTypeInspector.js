/**
 * Minimal DOM node for Warning/DisplayAnything rendering: props land as
 * plain fields, children append, `innerHTML` keeps its markup for dumps.
 */
class FakeNode {
  constructor() {
    this.children = [];
    this.style = {};
    this.dataset = {};
    this.classList = {add: () => {}, remove: () => {}};
  }
  append(...nodes) {
    for (const node of nodes.flat(Infinity)) {
      if (node === undefined || node === null || node === false) {
        continue;
      }
      this.children.push(node);
    }
  }
  appendChild(node) {
    this.append(node);
    return node;
  }
  set innerHTML(html) {
    this.children = [];
    this.html = String(html);
  }
  get innerHTML() {
    return this.html ?? '';
  }
  addEventListener() {}
  removeEventListener() {}
  querySelector() {
    return null;
  }
}
export {FakeNode};
