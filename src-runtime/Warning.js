import {options} from "./options.js";
import {DisplayAnything} from './DisplayAnything.js';
import {Tr, Td, Button, Details, Summary, Pre, Div, Span} from './jsx.js';
import {humanizeExpect} from './humanizeExpect.js';
import {stringifyType} from './stringifyType.js';
import {previewValue} from './previewValue.js';
import {describeValueType, prettyValue} from './describeValue.js';
import {formatMapKey} from './formatMapKey.js';
import {snapshotTag} from './snapshotTag.js';
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
 * type tag survives. Cycle-safe, depth-capped, never throws. Breadth is
 * deliberately uncapped here: the tree renders in clickable batches and
 * keeps every row loadable, so slicing the clone would hide data the tree
 * can no longer reach.
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
    for (let i = 0; i < value.length; i++) {
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
  for (const key of Object.keys(value)) {
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
 * Renders the comparator Actual pane: an expandable tree of the value where
 * every row pinned by a diagnosis finding carries the failure highlight and
 * every branch above a failure starts open, so the pane expands itself into
 * the mismatch instead of hiding it behind closed disclosures.
 * @param {*} value - The actual value.
 * @param {string} rootPath - Finding root path (the argument name).
 * @param {Set<string>} failPaths - Failing paths from `collectFailPaths`.
 * @returns {HTMLElement|null} The tree, or null when rendering failed.
 */
function renderActualValue(value, rootPath, failPaths) {
  try {
    const root = String(rootPath || 'value');
    const fails = failPaths instanceof Set ? failPaths : new Set();
    const wrap = Div({className: 'rti-line'});
    wrap.append(buildActualContent(value, root, 0, [], fails, true));
    return wrap;
  } catch {
    return null;
  }
}
/** Rows rendered per batch before a `...(+N more)` marker offers the next batch on click. */
const MAX_ACTUAL_BATCH = 20;
/** Auto-loaded rows ceiling: failures reveal themselves past the first batch, but hostile values still batch. */
const MAX_ACTUAL_AUTOLOAD = 100;
/** Non-failing branches render this many levels deep; failure paths always render fully. */
const MAX_ACTUAL_DEPTH = 3;
/** Hard recursion cap along failure paths, mirroring the differ. */
const MAX_ACTUAL_RECURSE = 6;
/**
 * Appends an object key to a finding path, the same way the differ names it.
 * @param {string} path - Parent path.
 * @param {string} key - Child key.
 * @returns {string} Child path.
 */
function actualChildPath(path, key) {
  return path ? `${path}.${String(key)}` : String(key);
}
/**
 * Appends a list index to a finding path, the same way the differ names set members.
 * @param {string} path - Parent path.
 * @param {number} index - Member index.
 * @returns {string} Member path.
 */
function actualIndexPath(path, index) {
  return `${path}[${index}]`;
}
/**
 * Appends a map entry to a finding path, the same way the differ names it.
 * @param {string} path - Parent path.
 * @param {*} key - Entry key.
 * @returns {string} Entry path.
 */
function actualMapPath(path, key) {
  return `${path}.get(${formatMapKey(key)})`;
}
/**
 * True when a failing path sits at or below `path`: the branch must render
 * and open so the failure stays visible. The separator check keeps
 * `config.get('ab')` from matching `config.get('a')`.
 * @param {string} path - The branch path.
 * @param {Set<string>} failPaths - Failing paths.
 * @returns {boolean} True when the subtree holds a failure.
 */
function actualCovers(path, failPaths) {
  for (const fail of failPaths) {
    if (fail === path) {
      return true;
    }
    if (fail.length > path.length && fail.startsWith(path)) {
      const next = fail[path.length];
      if (next === '.' || next === '[') {
        return true;
      }
    }
  }
  return false;
}
/**
 * Reads one property without ever throwing: values behind throwing getters
 * surface as markers instead of breaking the whole tree.
 * @param {*} value - The object to read from.
 * @param {string} key - The key to read.
 * @returns {*} The property, or a marker when unreadable.
 */
function actualSafeRead(value, key) {
  try {
    return value[key];
  } catch {
    return '[Getter threw]';
  }
}
/**
 * Value span class for a leaf: primitives keep their type color, collapsed
 * structures read as types.
 * @param {*} value - The leaf value.
 * @returns {string} CSS class.
 */
function actualLeafClass(value) {
  const kind = typeof value;
  if (kind === 'string' || kind === 'number' || kind === 'boolean') {
    return `rti-${kind}`;
  }
  if (value === null) {
    return 'rti-null';
  }
  if (value === undefined) {
    return 'rti-undefined';
  }
  return 'rti-type';
}
/**
 * One table-style row: an optional `label : content` pair, highlighted when
 * the row's own path failed.
 * @param {string|null} label - Row label, or null for a bare value.
 * @param {string} sep - Label/value separator.
 * @param {HTMLElement} content - Rendered value.
 * @param {boolean} failed - True when the row's own path failed.
 * @returns {HTMLDivElement} The row.
 */
function actualRow(label, sep, content, failed) {
  const row = Div({className: failed ? 'rti-fail-hit' : undefined});
  if (label === null) {
    row.append(content);
    return row;
  }
  row.append(Span({className: 'rti-key', textContent: label}),
             Span({className: 'rti-separator', textContent: sep}),
             content);
  return row;
}
/**
 * Renders the next batch of branch rows, with a click-to-load marker while
 * rows stay hidden. Batches past the first auto-load (up to a ceiling) while
 * they still hide failures, so failures never hide behind the marker yet
 * hostile values still batch.
 * @param {HTMLDetailsElement} details - The branch to fill.
 * @param {object[]} items - Row descriptors (`{label, sep, path, read}`).
 * @param {Set<string>} failPaths - Failing paths.
 * @param {number} depth - Current nesting depth.
 * @param {object[]} ancestors - Live ancestors (cycle guard).
 */
function renderActualBatch(details, items, failPaths, depth, ancestors) {
  let lastFail = -1;
  items.forEach((item, i) => {
    if (actualCovers(item.path, failPaths)) {
      lastFail = i;
    }
  });
  let shown = Math.min(items.length, MAX_ACTUAL_BATCH);
  let attached = false;
  /**
   * Paints the hidden-row count onto the marker.
   * @param {HTMLDivElement} node - The marker.
   */
  const paint = (node) => {
    node.textContent = `...(+${items.length - shown} more)`;
  };
  const marker = Div({className: 'rti-more', dataset: {shown: String(shown), total: String(items.length)},
    title: 'Show more rows'});
  /**
   * Loads the next batch of rows where the marker was clicked.
   */
  const loadMore = () => {
    marker.remove();
    attached = false;
    const next = Math.min(items.length, shown + MAX_ACTUAL_BATCH);
    for (let i = shown; i < next; i++) {
      details.append(renderActualItem(items[i], depth, ancestors, failPaths));
    }
    shown = next;
    if (shown < items.length) {
      paint(marker);
      details.append(marker);
      attached = true;
    }
  };
  marker.onclick = loadMore;
  for (let i = 0; i < shown; i++) {
    details.append(renderActualItem(items[i], depth, ancestors, failPaths));
  }
  if (shown < items.length) {
    paint(marker);
    details.append(marker);
    attached = true;
  }
  // Auto-load past the first batch while hidden failures remain: failures
  // never hide behind the marker, yet hostile values still batch (the guard
  // bounds total batches and every load grows `shown`, so this terminates).
  for (let guard = 0; guard < MAX_ACTUAL_AUTOLOAD; guard++) {
    if (!attached || shown > lastFail) {
      break;
    }
    loadMore();
  }
}
/**
 * Renders one branch row from its descriptor.
 * @param {object} item - Row descriptor (`{label, sep, path, read}`).
 * @param {number} depth - Current nesting depth.
 * @param {object[]} ancestors - Live ancestors (cycle guard).
 * @param {Set<string>} failPaths - Failing paths.
 * @returns {HTMLDivElement} The row.
 */
function renderActualItem(item, depth, ancestors, failPaths) {
  let val;
  try {
    val = item.read();
  } catch {
    val = '[Unreadable]';
  }
  return actualRow(item.label, item.sep, buildActualContent(val, item.path, depth, ancestors, failPaths),
                   failPaths.has(item.path));
}
/**
 * Builds one branch: a disclosure with a tag header and batched child rows.
 * The root and every branch above a failure start open.
 * @param {string} header - Branch tag, e.g. `Map(2)`.
 * @param {object[]} items - Row descriptors.
 * @param {string} path - Branch path.
 * @param {number} depth - Current nesting depth.
 * @param {object[]} ancestors - Live ancestors (cycle guard).
 * @param {Set<string>} failPaths - Failing paths.
 * @returns {HTMLDetailsElement} The branch.
 */
function buildActualBranch(header, items, path, depth, ancestors, failPaths) {
  const failed = failPaths.has(path);
  const details = Details({open: depth === 0 || actualCovers(path, failPaths) ? true : undefined,
    className: failed ? 'rti-fail-hit' : undefined},
                          Summary({textContent: header}));
  renderActualBatch(details, items, failPaths, depth + 1, ancestors);
  return details;
}
/**
 * Tries the live `Map` entries, falling back to recorded snapshot entries.
 * @param {*} value - The value to read.
 * @returns {Array|null} `[key, entryValue]` pairs, or null when unreadable.
 */
function actualMapEntries(value) {
  try {
    if (value instanceof Map) {
      return [...value.entries()].map(([key, entry]) => [key, entry]);
    }
  } catch {
    return null;
  }
  try {
    const tag = snapshotTag(value);
    if (tag === 'Map' && Array.isArray(value.entries)) {
      return value.entries.map((entry) => (Array.isArray(entry) ? [entry[0], entry[1]] : [entry, undefined]));
    }
  } catch {
    return null;
  }
  return null;
}
/**
 * Tries the live `Set`/array items, falling back to recorded snapshots.
 * @param {*} value - The value to read.
 * @returns {Array|null} Items, or null when unreadable.
 */
function actualSeqItems(value) {
  try {
    if (value instanceof Set) {
      return [...value.values()];
    }
    if (Array.isArray(value) || isTypedArray(value)) {
      return Array.from({length: value.length}, (_, i) => actualSafeRead(value, i));
    }
  } catch {
    return null;
  }
  try {
    const tag = snapshotTag(value);
    if ((tag === 'Set' && Array.isArray(value.values)) ||
        ((tag?.endsWith('Array') || tag === 'Buffer') && Array.isArray(value.values))) {
      return [...value.values];
    }
  } catch {
    return null;
  }
  return null;
}
/**
 * Own enumerable keys minus the snapshot envelope tag, or null when the
 * value has no listable keys.
 * @param {*} value - The value to read.
 * @returns {string[]|null} Keys, or null for keyless values.
 */
function actualKeys(value) {
  let keys;
  try {
    keys = Object.keys(value);
  } catch {
    return null;
  }
  if (snapshotTag(value) !== undefined) {
    keys = keys.filter((key) => key !== '$type');
  }
  return keys.length ? keys : null;
}
/**
 * Branch tag for objects: the snapshot tag, the class name, or the plain
 * `object` fallback.
 * @param {*} value - The value to tag.
 * @returns {string} Header tag.
 */
function actualObjectTag(value) {
  try {
    const snap = snapshotTag(value);
    if (snap !== undefined) {
      return snap;
    }
    const proto = Object.getPrototypeOf(value);
    if (proto !== null && proto !== Object.prototype && value.constructor?.name) {
      return value.constructor.name;
    }
  } catch {
    // Fall through to the fallback.
  }
  return 'object';
}
/**
 * Renders any value as Actual-pane content: branches for navigable shapes
 * (`Map`/`Set`/typed arrays/snapshots/objects/arrays/instances), one-line
 * leaves for everything else. Failing branches open. Total: unreadable
 * corners degrade to one-line leaves.
 *
 * Only the root marks itself: nested content lives inside a row and the
 * row owns the highlight, so failures never paint twice.
 * @param {*} value - The value to render.
 * @param {string} path - Finding path of this value.
 * @param {number} depth - Current nesting depth.
 * @param {object[]} ancestors - Live ancestors (cycle guard).
 * @param {Set<string>} failPaths - Failing paths.
 * @param {boolean} markSelf - True for the root call only.
 * @returns {HTMLElement} Rendered content.
 */
function buildActualContent(value, path, depth, ancestors, failPaths, markSelf = false) {
  const failed = markSelf && failPaths.has(path);
  /**
   * One-line leaf for collapsed or unrenderable values.
   * @returns {HTMLElement} The leaf.
   */
  const leaf = () => Span({className: `${actualLeafClass(value)}${failed ? ' rti-fail-hit' : ''}`,
    textContent: shortPreview(value)});
  try {
    if (value !== null && typeof value === 'object') {
      if (ancestors.includes(value)) {
        return Span({className: failed ? 'rti-fail-hit' : undefined, textContent: '[Circular]'});
      }
      if (depth >= MAX_ACTUAL_RECURSE) {
        return leaf();
      }
      const next = [...ancestors, value];
      const open = depth < MAX_ACTUAL_DEPTH || actualCovers(path, failPaths);
      // Maps (live or recorded): one row per entry at `.get(key)` paths.
      const mapEntries = actualMapEntries(value);
      if (mapEntries) {
        if (!open) {
          return leaf();
        }
        let size = mapEntries.length;
        try {
          size = value.size ?? value.entries?.length ?? size;
        } catch {
          // Keep the counted size.
        }
        return buildActualBranch(`Map(${size})`,
                                 mapEntries.map(([key, entry]) => ({
                                   label: shortPreview(key), sep: '=>',
                                   path: actualMapPath(path, key), read: () => entry,
                                 })),
                                 path, depth, next, failPaths);
      }
      // Sets, arrays and typed arrays (live or recorded): one row per index.
      const seqItems = actualSeqItems(value);
      if (seqItems) {
        if (!open) {
          return leaf();
        }
        let tag = 'Set';
        let size = seqItems.length;
        try {
          const snap = snapshotTag(value);
          if (snap !== undefined) {
            tag = snap;
          } else if (value instanceof Set) {
            tag = 'Set';
          } else if (Array.isArray(value)) {
            tag = 'array';
          } else {
            tag = value.constructor?.name ?? 'ArrayBufferView';
          }
          if (typeof value.size === 'number') {
            size = value.size;
          } else if (typeof value.length === 'number') {
            size = value.length;
          }
        } catch {
          // Keep the counted size.
        }
        const header = tag === 'array' ? `array [${size}]` : `${tag}(${size})`;
        return buildActualBranch(header,
                                 seqItems.map((item, i) => ({
                                   label: `[${i}]`, sep: ':',
                                   path: actualIndexPath(path, i), read: () => item,
                                 })),
                                 path, depth, next, failPaths);
      }
      // Leaves DisplayAnything cannot expand: buffers, promises, weak
      // collections, dates, regexps, errors, URLs and host objects.
      if (isPreviewLeaf(value) || value instanceof Date || value instanceof RegExp ||
          value instanceof Error || (typeof Element !== 'undefined' && value instanceof Element)) {
        return leaf();
      }
      // Plain objects, class instances and recorded snapshots: one row per key.
      const keys = actualKeys(value);
      if (keys) {
        let collapse = false;
        try {
          const proto = Object.getPrototypeOf(value);
          // Giant host instances collapse: a 20-row excerpt of `Window`
          // internals helps nobody in the Actual pane.
          collapse = keys.length > MAX_ACTUAL_BATCH && snapshotTag(value) === undefined &&
            proto !== Object.prototype && proto !== null;
        } catch {
          collapse = false;
        }
        if (!open || collapse) {
          return leaf();
        }
        return buildActualBranch(`${actualObjectTag(value)} {${keys.length}}`,
                                 keys.map((key) => ({
                                   label: key, sep: ':',
                                   path: actualChildPath(path, key), read: () => actualSafeRead(value, key),
                                 })),
                                 path, depth, next, failPaths);
      }
      return leaf();
    }
    return leaf();
  } catch {
    return Span({textContent: shortPreview(value)});
  }
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
  /** @type {import('./DisplayAnything.js').DisplayAnything | null} */
  _valueNode = null;
  /** @type {import('./DisplayAnything.js').DisplayAnything | null} */
  _expectNode = null;
  /** @type {HTMLDivElement | null} */
  _expectSummary = null;
  /** @type {HTMLElement | null} */
  _expectPretty = null;
  /** @type {HTMLDivElement | null} */
  _expectNotes = null;
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
  /**
   * Shows the latest value. Generic values refill their tree in place so
   * an expanded tree survives repeat errors; dedicated Map/Set/typed-array
   * trees and preview leaves rebuild like before. Never throws.
   */
  set value(_) {
    this._value = _;
    let generic = false;
    try {
      generic = !(_ instanceof Map) && !(_ instanceof Set) && !isTypedArray(_) && !isPreviewLeaf(_);
    } catch {
      generic = false;
    }
    if (generic && this._valueNode) {
      try {
        this._valueNode.refill(withCollectionPreviews(_));
        return;
      } catch {
        // Refill failed: rebuild below.
      }
    }
    this.td_value.innerHTML = '';
    this._valueNode = null;
    if (generic) {
      try {
        const display = new DisplayAnything(withCollectionPreviews(_));
        this.td_value.append(display.render());
        this._valueNode = display;
        return;
      } catch {
        // Fall through to the shared renderer below.
      }
    }
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
    if (this._expectNode) {
      try {
        // Refill in place so an open "full type" tree survives repeat hits.
        this._expectSummary.textContent = summary;
        this._expectSummary.title = summary;
        this._expectPretty.textContent = pretty;
        this._expectNode.refill(_);
        this._expectNotes.innerHTML = '';
        for (const note of notes) {
          this._expectNotes.append(Div({style: {fontSize: '11px', color: '#555'}}, note));
        }
        return;
      } catch {
        // Refill failed: rebuild below.
      }
    }
    this.td_expect.innerHTML = '';
    this._expectNode = null;
    let rendered;
    try {
      const display = new DisplayAnything(_);
      rendered = display.render();
      this._expectNode = display;
    } catch {
      this._expectNode = null;
      rendered = Div({textContent: pretty});
    }
    this._expectSummary = Div({title: summary, textContent: summary});
    this._expectPretty = Pre({textContent: pretty});
    this._expectNotes = Div({});
    for (const note of notes) {
      this._expectNotes.append(Div({style: {fontSize: '11px', color: '#555'}}, note));
    }
    this.td_expect.append(
      this._expectSummary,
      Details({}, Summary({textContent: 'full type'}), this._expectPretty, rendered, this._expectNotes),
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
export {Warning, renderCellValue, renderActualValue};
