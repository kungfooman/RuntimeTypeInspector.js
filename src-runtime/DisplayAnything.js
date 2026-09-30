import {Details, Div, Span, Summary} from './jsx.js';
import {oneLine, snapshotTag} from './describeValue.js';
/**
 * Rows rendered per branch before a `...(+N more)` marker offers the next
 * batch on click. Breadth lives here (not in the clone layer), so hidden
 * rows stay loadable instead of silently dropped.
 */
const ROW_BATCH = 20;
/**
 * Enumerable keys rendering as child rows, or null when the value is a leaf.
 * Leaves are primitives, nullish values, functions, manifestations past the
 * depth cap (which also terminates cyclic structures) and objects without
 * enumerable keys — exactly the shapes the previous string-template version
 * rendered as single rows.
 * @param {*} value - The value to inspect.
 * @param {number} depth - Current nesting depth.
 * @returns {string[]|null} Child keys, or null for leaves.
 */
function childKeys(value, depth) {
  if (value === null || typeof value !== 'object' || depth > 1) {
    return null;
  }
  let keys;
  try {
    keys = [];
    for (const key in value) {
      keys.push(key);
    }
  } catch {
    return null;
  }
  return keys.length ? keys : null;
}
/**
 * Reads one property without ever throwing: values behind throwing getters
 * surface as markers instead of breaking the whole tree.
 * @param {*} value - The object to read from.
 * @param {string} key - The key to read.
 * @returns {*} The property, or a marker when unreadable.
 */
function safeRead(value, key) {
  try {
    return value[key];
  } catch {
    return '[Getter threw]';
  }
}
/**
 * Expands any value into a natively expandable row tree: one row per key,
 * branches as `<details>` (the summary is the caret, the open state lives
 * in the DOM itself) and leaves as `key : value` rows. Strings are
 * JSON-quoted like before.
 *
 * Repeat errors refill the tree in place (`refill`) instead of replacing
 * it: rows are reconciled by key, so a tree the user expanded stays
 * expanded while its texts follow the latest value.
 */
class DisplayAnything {
  static nokey = Symbol("no key");
  /** @type {DisplayAnything[]} */
  children = [];
  /** @type {string | symbol} */
  key;
  /** @type {number} */
  depth = 0;
  /** @type {DisplayAnything | undefined} */
  parent;
  /** @type {any} */
  value;
  /** @type {HTMLElement | null} */
  el = null;
  /** @type {HTMLElement | null} */
  detailsEl = null;
  /** @type {HTMLElement | null} */
  valueEl = null;
  /** @type {HTMLElement | null} */
  typeEl = null;
  /** @type {HTMLElement | null} */
  sizeEl = null;
  /** @type {string[]} */
  allKeys = [];
  /** @type {number} */
  limit = ROW_BATCH;
  /** @type {HTMLElement | null} */
  markerEl = null;
  /**
   * Create a virtual node object.
   * @param {any} value - The value.
   * @param {string|symbol} [key] - The key.
   * @param {number} [depth] - The depth.
   * @param {DisplayAnything} [parent] - The parent.
   */
  constructor(value, key = DisplayAnything.nokey, depth = 0, parent) {
    this.value = value;
    this.key = key;
    this.depth = depth;
    this.parent = parent;
    this.allKeys = this.rowKeys(value) ?? [];
    this.syncNodes();
  }
  /**
   * The type of value as string.
   * @type {string}
   */
  get type() {
    const {value} = this;
    if (Array.isArray(value)) {
      return 'array';
    }
    const t = typeof value;
    if (t === 'string' || t === 'number' || t === 'boolean') {
      return t;
    }
    if (value === null) {
      return 'null';
    }
    if (value === undefined) {
      return 'undefined';
    }
    const proto = Object.getPrototypeOf(value);
    if (!proto) {
      console.log("no proto, happens for Object.create(null)");
      return t;
    }
    if (!proto.constructor) {
      console.log("proto but no constructor");
      return t;
    }
    return proto.constructor.name;
  }
  /**
   * @type {string | null}
   */
  get size() {
    const len = this.children.length;
    if (this.type === 'array') {
      return `[${len}]`;
    }
    if (this.value instanceof Object && this.value !== null) {
      let count = Object.keys(this.value).length;
      if (snapshotTag(this.value) !== undefined) {
        count = Math.max(0, count - 1);
      }
      return `{${count}}`;
    }
    return null;
  }
  /**
   * Recursively traverse virtual node.
   * @param {(node: DisplayAnything) => void} callback - The callback.
   */
  traverse(callback) {
    callback(this);
    this.children.forEach((child) => {
      child.traverse(callback);
    });
  }
  /**
   * Child row keys for a value: the enumerable keys, minus the snapshot
   * envelope tag (which renders as the branch header instead of a row).
   * Null when the value is a leaf.
   * @param {*} value - The value to inspect.
   * @returns {string[]|null} Row keys, or null for leaves.
   */
  rowKeys(value) {
    const keys = childKeys(value, this.depth);
    if (!keys) {
      return null;
    }
    const filtered = snapshotTag(value) !== undefined ?
      keys.filter((key) => key !== '$type') :
      keys;
    return filtered.length ? filtered : null;
  }
  /**
   * Render tree into DOM container.
   * @returns {HTMLElement} The HTML element.
   */
  render() {
    if (!this.el) {
      this.el = Div({className: 'rti-line', style: {marginLeft: `${this.depth * 18}px`}});
    }
    this.refreshContent();
    return this.el;
  }
  /**
   * Refills the tree with a new value without replacing nodes: matching
   * rows update their text in place, added keys append, removed keys drop.
   * Open disclosures survive, so investigation is not reset by the next
   * identical error. The batch limit survives too: loaded batches stay
   * loaded. Never throws; unreadable corners degrade to markers.
   * @param {any} value - The new value.
   */
  refill(value) {
    this.value = value;
    const keys = this.rowKeys(value);
    if (keys === null) {
      this.allKeys = [];
      this.children = [];
      if (this.el && !this.detailsEl && this.valueEl) {
        this.valueEl.textContent = this.valueToString();
      } else if (this.el) {
        this.refreshContent();
      }
      return;
    }
    this.allKeys = keys;
    if (!this.el || !this.detailsEl) {
      this.syncNodes();
      this.refreshContent();
      return;
    }
    this.updateHeader();
    this.reconcileChildren();
    this.updateMarker();
  }
  /**
   * Syncs child nodes with the shown key range, reusing matching nodes so
   * their open state survives. Pure model work, no DOM touches.
   */
  syncNodes() {
    const want = this.allKeys.slice(0, this.limit);
    const byKey = new Map(this.children.map((child) => [child.key, child]));
    this.children = want.map((key) => byKey.get(key) ??
      new DisplayAnything(safeRead(this.value, key), key, this.depth + 1, this));
  }
  /**
   * Reconciles the shown rows with the current key list: matching rows
   * refill in place (keeping their nodes and open state), new rows append
   * before the batch marker, vanished rows drop.
   */
  reconcileChildren() {
    const before = this.children;
    const reused = new Map(before.map((child) => [child.key, child]));
    this.syncNodes();
    for (const child of this.children) {
      if (reused.has(child.key)) {
        try {
          child.refill(safeRead(this.value, child.key));
        } catch {
          this.refreshContent();
          return;
        }
      } else if (this.markerEl) {
        this.detailsEl.insertBefore(child.render(), this.markerEl);
      } else {
        this.detailsEl.append(child.render());
      }
    }
    for (const old of before) {
      if (!this.children.includes(old)) {
        this.detailsEl.removeChild(old.el);
      }
    }
  }
  /**
   * Rebuilds the batch marker: `...(+N more)` while rows stay hidden, gone
   * once everything shows. The marker carries the shown/total counts in its
   * dataset and loads the next batch on click.
   */
  updateMarker() {
    if (this.markerEl) {
      try {
        this.detailsEl.removeChild(this.markerEl);
      } catch {
        // Already gone; rebuilding below covers it.
      }
      this.markerEl = null;
    }
    if (!this.detailsEl) {
      return;
    }
    const hidden = this.allKeys.length - this.children.length;
    if (hidden <= 0) {
      return;
    }
    this.markerEl = Div({
      className: 'rti-more',
      dataset: {shown: String(this.children.length), total: String(this.allKeys.length)},
      title: 'Show more rows',
      textContent: `...(+${hidden} more)`,
      onclick: () => this.showMore(),
    });
    this.detailsEl.append(this.markerEl);
  }
  /**
   * Reveals the next batch of rows where the marker was clicked. Shown rows
   * keep their nodes, so open disclosures survive batching too.
   */
  showMore() {
    this.limit += ROW_BATCH;
    const shown = this.children.length;
    this.syncNodes();
    if (!this.detailsEl) {
      return;
    }
    this.detailsEl.dataset.limit = String(this.limit);
    for (const child of this.children.slice(shown)) {
      if (this.markerEl) {
        this.detailsEl.insertBefore(child.render(), this.markerEl);
      } else {
        this.detailsEl.append(child.render());
      }
    }
    this.updateMarker();
  }
  /**
   * Opens every disclosure in the tree.
   */
  expand() {
    this.traverse((node) => {
      if (node.detailsEl) {
        node.detailsEl.open = true;
      }
    });
  }
  /**
   * Closes every disclosure in the tree.
   */
  collapse() {
    this.traverse((node) => {
      if (node.detailsEl) {
        node.detailsEl.open = false;
      }
    });
  }
  /**
   * Flips this node's own disclosure, if it has one.
   */
  toggleNode() {
    if (this.detailsEl) {
      this.detailsEl.open = !this.detailsEl.open;
    }
  }
  /**
   * Rebuilds this row's content inside its stable wrapper: leaves become
   * `key : value` rows, branches become disclosures with one child row
   * per key. The wrapper itself is never replaced, so siblings keep
   * their open state.
   */
  refreshContent() {
    if (!this.el) {
      return;
    }
    this.el.innerHTML = '';
    this.detailsEl = null;
    this.valueEl = null;
    this.typeEl = null;
    this.sizeEl = null;
    this.markerEl = null;
    if (this.children.length) {
      this.buildBranch();
    } else {
      this.buildLeaf();
    }
  }
  /**
   * Appends the `key : value` leaf row (or the bare value for the root).
   */
  buildLeaf() {
    if (!this.parent) {
      this.valueEl = Div({className: `rti-${this.safeType()}`, textContent: this.valueToString()});
      this.el.append(this.valueEl);
      return;
    }
    this.valueEl = Span({className: `rti-${this.safeType()}`, textContent: this.valueToString()});
    this.el.append(
      Span({className: 'rti-key', textContent: String(this.key)}),
      Span({className: 'rti-separator', textContent: ':'}),
      this.valueEl,
    );
  }
  /**
   * Appends the disclosure with the type/size header and one child row
   * per key. The root starts open like the other cell trees; nested rows
   * start closed.
   */
  buildBranch() {
    const header = [];
    if (this.key === DisplayAnything.nokey) {
      this.typeEl = Span({className: 'rti-type', textContent: this.headerTag()});
      header.push(this.typeEl);
    } else {
      header.push(Span({className: 'rti-key', textContent: String(this.key)}));
      const snap = snapshotTag(this.value);
      if (snap !== undefined) {
        this.typeEl = Span({className: 'rti-type', textContent: snap});
        header.push(this.typeEl);
      }
    }
    this.sizeEl = Span({className: 'rti-size', textContent: this.safeSize()});
    header.push(this.sizeEl);
    this.detailsEl = Details({open: this.depth === 0 ? true : undefined}, Summary({}, ...header));
    this.detailsEl.dataset.limit = String(this.limit);
    this.syncNodes();
    for (const child of this.children) {
      this.detailsEl.append(child.render());
    }
    this.el.append(this.detailsEl);
    this.updateMarker();
  }
  /**
   * Refreshes the branch header after a refill (the tag or entry count
   * may have changed with the value). Keeps the previous text when the
   * new one is unreadable.
   */
  updateHeader() {
    if (this.typeEl) {
      this.typeEl.textContent = this.headerTag(this.typeEl.textContent);
    }
    if (this.sizeEl) {
      this.sizeEl.textContent = this.safeSize(this.sizeEl.textContent);
    }
  }
  /**
   * The branch header tag: the recorded tag for snapshots (whose envelope
   * key renders no row), otherwise the live type tag.
   * @param {string} [fallback] - Kept when the tag is unreadable.
   * @returns {string} Header tag or fallback.
   */
  headerTag(fallback = 'object') {
    return snapshotTag(this.value) ?? this.safeType(fallback);
  }
  /**
   * The type tag, falling back when the value cannot be inspected.
   * @param {string} [fallback] - Kept when the tag is unreadable.
   * @returns {string} Type tag or fallback.
   */
  safeType(fallback = 'object') {
    try {
      return this.type;
    } catch {
      return fallback;
    }
  }
  /**
   * The size badge, falling back when the value cannot be inspected.
   * @param {string} [fallback] - Kept when the badge is unreadable.
   * @returns {string} Size badge or fallback.
   */
  safeSize(fallback = '') {
    try {
      return String(this.size ?? '');
    } catch {
      return fallback;
    }
  }
  /**
   * Single-line value text: strings JSON-quoted, objects as their bounded
   * one-line description so rows never dead-end at `[object …]`.
   * Unreadable values degrade to a marker without logging: refills run on
   * repeat errors, so logging here would spam the console every frame.
   * @returns {string} Single-line value text.
   */
  valueToString() {
    try {
      const {value} = this;
      if (typeof value === 'string') {
        return JSON.stringify(value);
      }
      if (value !== null && typeof value === 'object') {
        return oneLine(value);
      }
      return value + "";
    } catch {
      return 'valueToString failed';
    }
  }
}
export {DisplayAnything};
