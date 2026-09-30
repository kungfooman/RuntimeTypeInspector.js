import {options} from "./options.js";
import {DisplayAnything} from 'display-anything';
import {Tr, Td, Button, Details, Summary, Pre, Div} from './jsx.js';
import {humanizeExpect} from './humanizeExpect.js';
import {stringifyType} from './stringifyType.js';
import {previewValue} from './stringifyValue.js';
import {describeValueType, prettyValue} from './describeValue.js';
/** Max `Map`/`Set`/typed-array entries rendered into the Value column (issue #267). */
const MAX_CELL_ENTRIES = 20;
/** Max characters per key/value one-line preview in the Value column. */
const MAX_CELL_PREVIEW = 200;
/**
 * Bounded one-line preview for a single value in the error table.
 * Values with a dedicated display rendering (`Map`/`Set` as inferred
 * generics, typed arrays, dates, errors, bigints, class instances, …) read
 * as their one-line description; everything else keeps the JSON snapshot.
 * Never throws; falls back to `String()`.
 * @param {*} value - The value to preview.
 * @returns {string} Single-line preview.
 */
function shortPreview(value) {
  try {
    const text = prettyValue(value) !== undefined ?
      describeValueType(value, 2) :
      previewValue(value, MAX_CELL_PREVIEW);
    const str = typeof text === 'string' ? text : String(text);
    return str.length > MAX_CELL_PREVIEW ? `${str.slice(0, MAX_CELL_PREVIEW - 3)}...` : str;
  } catch {
    try {
      return String(value?.toString?.() ?? value);
    } catch {
      return '[Unreadable]';
    }
  }
}
/**
 * True for typed arrays (`Uint8Array`, `Float64Array`, Node `Buffer`, …):
 * every `ArrayBuffer` view except `DataView`. Never throws.
 * @param {*} value - The value to test.
 * @returns {boolean} True for typed arrays.
 */
function isTypedArray(value) {
  try {
    return ArrayBuffer.isView(value) && !(value instanceof DataView);
  } catch {
    return false;
  }
}
/**
 * Renders a live `Map` as an expandable tree node (root open by default),
 * with one `key => value` row per entry. `DisplayAnything` iterates `for..in`
 * and stringifies the rest, so without this a `Map` collapses to a bare
 * `[object Map]` leaf (issue #267). Entry count is capped — deeper
 * inspection lives in the Compare window's Actual pane.
 * @param {Map} map - The map to render.
 * @returns {HTMLElement} The tree element.
 */
function renderMapValue(map) {
  let entries;
  try {
    entries = [...map.entries()];
  } catch {
    return Div({textContent: shortPreview(map)});
  }
  const shown = entries.slice(0, MAX_CELL_ENTRIES);
  const box = Details({open: true}, Summary({textContent: `Map(${map.size})`}));
  for (const [key, val] of shown) {
    box.append(Div({textContent: `${shortPreview(key)} => ${shortPreview(val)}`}));
  }
  if (entries.length > shown.length) {
    box.append(Div({textContent: `...(+${entries.length - shown.length} more)`}));
  }
  return box;
}
/**
 * Renders a live `Set` the same way as `renderMapValue` (issue #267).
 * @param {Set} set - The set to render.
 * @returns {HTMLElement} The tree element.
 */
function renderSetValue(set) {
  let items;
  try {
    items = [...set.values()];
  } catch {
    return Div({textContent: shortPreview(set)});
  }
  const shown = items.slice(0, MAX_CELL_ENTRIES);
  const box = Details({open: true}, Summary({textContent: `Set(${set.size})`}));
  for (const item of shown) {
    box.append(Div({textContent: shortPreview(item)}));
  }
  if (items.length > shown.length) {
    box.append(Div({textContent: `...(+${items.length - shown.length} more)`}));
  }
  return box;
}
/**
 * Renders a live typed array as an expandable tree node (root open by
 * default), with one `index: value` row per element — the same treatment
 * as `Map`/`Set` cells. Without this the cell collapses to
 * a bare type header with its values hidden. Element count is
 * capped — deeper inspection lives in the Compare window's Actual pane.
 * @param {*} array - The typed array to render.
 * @returns {HTMLElement} The tree element.
 */
function renderTypedArrayValue(array) {
  let tag = 'ArrayBufferView';
  try {
    tag = array.constructor?.name ?? tag;
  } catch {
    // Keep the fallback.
  }
  let len = 0;
  try {
    len = array.length;
  } catch {
    return Div({textContent: shortPreview(array)});
  }
  if (typeof len !== 'number') {
    return Div({textContent: shortPreview(array)});
  }
  const box = Details({open: true}, Summary({textContent: `${tag}(${len})`}));
  const shown = Math.min(len, MAX_CELL_ENTRIES);
  for (let i = 0; i < shown; i++) {
    let item;
    try {
      item = array[i];
    } catch {
      box.append(Div({textContent: `${i}: [Unreadable]`}));
      continue;
    }
    box.append(Div({textContent: `${i}: ${shortPreview(item)}`}));
  }
  if (len > shown) {
    box.append(Div({textContent: `...(+${len - shown} more)`}));
  }
  return box;
}
/**
 * True for leaf values `DisplayAnything` renders as `[object …]` (or drops
 * content for): buffers/views, bigints, promises, weak collections and
 * URLs. Those cells render as a one-line preview instead.
 * Never throws.
 * @param {*} value - The value to test.
 * @returns {boolean} True when the cell should be a preview leaf.
 */
function isPreviewLeaf(value) {
  try {
    if (typeof value === 'bigint') {
      return true;
    }
    if (value === null || typeof value !== 'object') {
      return false;
    }
    if (value instanceof ArrayBuffer) {
      return true;
    }
    if (typeof SharedArrayBuffer !== 'undefined' && value instanceof SharedArrayBuffer) {
      return true;
    }
    if (value instanceof DataView) {
      return true;
    }
    if (value instanceof Promise) {
      return true;
    }
    if (value instanceof WeakMap || value instanceof WeakSet) {
      return true;
    }
    if (typeof URL !== 'undefined' && value instanceof URL) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
/**
 * Clones plain objects/arrays for `DisplayAnything`, replacing nested
 * values that have a dedicated display rendering (`Map`/`Set`, typed
 * arrays, buffers, bigints, promises, …) with bounded one-line previews.
 * Without this a map nested inside an object still renders as
 * `[object Map]`, since `DisplayAnything` only walks `for..in` keys. Class
 * instances (and other non-plain objects) pass through untouched so their
 * type tag survives. Cycle-safe, depth- and breadth-capped, never throws.
 * @param {*} value - The value to prepare.
 * @param {number} depth - Current cloning depth.
 * @param {Map} seen - Originals already cloned (cycle guard).
 * @returns {*} Display-safe value.
 */
function withCollectionPreviews(value, depth = 0, seen = new Map()) {
  let isPreview = false;
  try {
    isPreview = value instanceof Map || value instanceof Set || isTypedArray(value) || isPreviewLeaf(value);
  } catch {
    return '[Unreadable]';
  }
  if (isPreview) {
    return shortPreview(value);
  }
  if (!value || typeof value !== 'object' || depth > 3) {
    return value;
  }
  if (seen.has(value)) {
    return seen.get(value);
  }
  if (Array.isArray(value)) {
    const clone = [];
    seen.set(value, clone);
    const count = Math.min(value.length, MAX_CELL_ENTRIES);
    for (let i = 0; i < count; i++) {
      let item;
      try {
        item = value[i];
      } catch {
        clone.push('[Unreadable]');
        continue;
      }
      clone.push(withCollectionPreviews(item, depth + 1, seen));
    }
    return clone;
  }
  let proto;
  try {
    proto = Object.getPrototypeOf(value);
  } catch {
    return value;
  }
  if (proto !== Object.prototype && proto !== null) {
    return value;
  }
  const clone = {};
  seen.set(value, clone);
  for (const key of Object.keys(value).slice(0, MAX_CELL_ENTRIES)) {
    let prop;
    try {
      prop = value[key];
    } catch {
      clone[key] = '[Getter threw]';
      continue;
    }
    clone[key] = withCollectionPreviews(prop, depth + 1, seen);
  }
  return clone;
}
/**
 * Renders any error-table value: live `Map`/`Set`/typed-array instances get
 * the expandable bounded tree, leaf shapes `DisplayAnything` cannot show
 * (buffers, bigints, promises, …) render as a one-line preview, everything
 * else goes through `DisplayAnything` (with nested values pre-previewed).
 * @param {*} value - The value to render.
 * @returns {HTMLElement} The cell content.
 */
function renderCellValue(value) {
  if (value instanceof Map) {
    return renderMapValue(value);
  }
  if (value instanceof Set) {
    return renderSetValue(value);
  }
  if (isTypedArray(value)) {
    return renderTypedArrayValue(value);
  }
  if (isPreviewLeaf(value)) {
    return Div({textContent: shortPreview(value)});
  }
  return new DisplayAnything(withCollectionPreviews(value)).render();
}
/**
 * @todo Also construct a Node.js version, WarningConsole and WarningBrowser
 */
class Warning {
  /** @type {HTMLTableRowElement} */
  tr;
  /** @type {HTMLTableCellElement} */
  td_dbg;
  /** @type {HTMLTableCellElement} */
  td_hide;
  /** @type {HTMLTableCellElement} */
  td_location;
  /** @type {HTMLTableCellElement} */
  td_name;
  /** @type {HTMLTableCellElement} */
  td_expect;
  /** @type {HTMLTableCellElement} */
  td_value;
  /** @type {HTMLTableCellElement} */
  td_count;
  /** @type {HTMLTableCellElement} */
  td_desc;
  /** @type {HTMLTableCellElement} */
  td_inspect;
  /** @type {HTMLButtonElement} */
  button_inspect;
  /** @type {HTMLButtonElement} */
  button_dbgInput;
  /** @type {HTMLButtonElement} */
  button_hideInput;
  _msg             = '';
  _hits            = 0;
  _hidden          = false;
  _dbg             = false;
  /** @type {any} */
  _value;
  /** @type {string[]} */
  detailStrings = [];
  /** @type {import('./validateType.js').Type} */
  _expect;
  constructor(msg, value, expect, loc, name, onCompare) {
    this.loc = loc;
    this.name = name;
    this._expect = expect;
    this.onCompare = onCompare;
    this.button_dbgInput = Button({textContent: '🧐', onclick: () => this.dbg = !this.dbg});
    this.button_hideInput = Button({textContent: '👁️‍🗨️', onclick: () => this.hidden = !this.hidden});
    this.button_inspect = Button({textContent: '🔍', title: 'Compare expected vs actual fullscreen', onclick: () => this.onCompare?.()});
    this.td_hide = Td({}, this.button_hideInput);
    this.td_dbg = Td({}, this.button_dbgInput);
    this.td_count = Td({});
    this.td_location = Td({textContent: loc});
    this.td_name = Td({textContent: name});
    this.td_expect = Td({className: 'expect'});
    this.td_value = Td({className: 'value'});
    this.td_desc = Td({className: 'desc', innerText: msg});
    this.td_inspect = Td({}, this.button_inspect);
    const {td_hide, td_dbg, td_count, td_location, td_name, td_expect, td_value, td_desc, td_inspect} = this;
    this.tr = Tr({}, td_hide, td_dbg, td_count, td_location, td_name, td_expect, td_value, td_desc, td_inspect);
    // todo hits setter/getter
    //td_expect.textContent = expect;
    this.expect = expect;
  }
  /**
   * Callback opening the fullscreen comparator for this row (wired by TypePanel).
   * @type {(() => void) | undefined}
   */
  onCompare;
  set dbg(_) {
    this._dbg = _;
    this.button_dbgInput.textContent = _ ? '🐞' : '🧐';
    this.eventSource?.postMessage({
      type: 'rti',
      action: _ ? 'addBreakpoint' : 'deleteBreakpoint',
      destination: 'worker',
      key: `${this.loc}-${this.name}`
    });
  }
  /**
   * Trigger `debugger;` next time this error is hit.
   */
  get dbg() {
    return this._dbg;
  }
  /**
   * The event from Worker, IFrame or window.
   * @type {import('./TypePanel.js').MessageEventRTI | undefined}
   */
  event;
  /**
   * @type {MessageEventSource | EventTarget | null}
   */
  get eventSource() {
    const {event} = this;
    if (!event) {
      // We have no event yet for restored state
      return null;
    }
    // If event came from window:
    /** @type {MessageEventSource | EventTarget | null} */
    let to = event.source;
    if (!to) {
      // If the event came from a worker, we get access to worker via this:
      to = event.srcElement;
    }
    if (!to) {
      console.log("Should not happen, why no event source?");
      debugger;
    }
    return to;
  }
  set hidden(_) {
    this._hidden = _;
    this.button_hideInput.textContent = _ ? '🌚' : '👁️‍🗨️';
    // Doesn't really matter if the workers know about it, we can just early-out in `Warning#warn`.
    // Maybe performance could be improved with many warnings, so might reconsider...
    // this.eventSource?.postMessage({
    //   type: 'rti',
    //   action: _ ? 'hide' : 'show',
    //   destination: 'worker',
    //   key: `${this.loc}-${this.name}`
    // });
  }
  /**
   * Prevent F12/DevTools spamming for errors that occur often, even in "spam" mode.
   */
  get hidden() {
    return this._hidden;
  }
  set hits(_) {
    this._hits = _;
    this.td_count.textContent = _ + '';
  }
  /**
   * How often this error occured.
   */
  get hits() {
    return this._hits;
  }
  /**
   * @todo Log and show old values aswell for more comprehensive overview?
   */
  set value(_) {
    this._value = _;
    this.td_value.innerHTML = '';
    let node;
    try {
      node = renderCellValue(_);
    } catch {
      node = Div({textContent: shortPreview(_)});
    }
    this.td_value.append(node);
  }
  get value() {
    return this._value;
  }
  /**
   * @type {import('./validateType.js').Type}
   * @param {import('./validateType.js').Type} _ - The expected type.
   */
  set expect(_) {
    this._expect = _;
    const {summary, notes} = humanizeExpect(_);
    let pretty = summary;
    try {
      pretty = stringifyType(_, null, 2);
    } catch {
      // Fall back to the one-line summary.
    }
    const val = new DisplayAnything(_);
    const rendered = val.render();
    this.td_expect.innerHTML = '';
    const noteNodes = notes.map((note) => Div({style: {fontSize: '11px', color: '#555'}}, note));
    this.td_expect.append(
      Div({title: summary}, summary),
      Details({}, Summary({}, 'full type'), Pre({}, pretty), rendered, ...noteNodes),
    );
  }
  get expect() {
    return this._expect;
  }
  set msg(_) {
    this._msg = _;
    this.td_desc.textContent = _ + '';
  }
  get msg() {
    return this._msg;
  }
  /**
   * @type {string[]}
   */
  set state(_) {
    if (!_) {
      return;
    }
    if (_.includes('dbg')) {
      this.dbg = true;
    }
    if (_.includes('hidden')) {
      this.hidden = true;
    }
  }
  /**
   * Returns state of dbg/hidden only if relevant (meaning not being default values).
   * @returns {string[]|undefined} Relevant changes or `undefined`.
   */
  get state() {
    const {dbg, hidden} = this;
    const ret = [];
    if (dbg) {
      ret.push('dbg');
    }
    if (hidden) {
      ret.push('hidden');
    }
    if (!ret.length) {
      return undefined; // ESLint bs
    }
    return ret;
  }
  /**
   * @param {string} msg - The main message.
   * @param {...any} extra - Extra strings or objects etc.
   */
  warn(msg, ...extra) {
    const {mode} = options;
    if (this.hidden) {
      return;
    }
    switch (mode) {
      case 'spam':
        console.error(msg, ...extra);
        break;
      case 'once':
        if (this.hits === 1) {
          console.error(msg, ...extra);
        }
        break;
      case 'never':
        break;
      default:
        console.error("warn> unsupported mode:", mode);
    }
  }
}
export {Warning, renderCellValue};
