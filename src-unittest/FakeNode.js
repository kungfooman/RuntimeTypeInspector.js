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
  removeChild(node) {
    const index = this.children.indexOf(node);
    if (index !== -1) {
      this.children.splice(index, 1);
    }
    return node;
  }
  insertBefore(node, ref) {
    if (node === undefined || node === null || node === false) {
      return node;
    }
    const at = ref ? this.children.indexOf(ref) : -1;
    if (at === -1) {
      this.children.push(node);
    } else {
      this.children.splice(at, 0, node);
    }
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
