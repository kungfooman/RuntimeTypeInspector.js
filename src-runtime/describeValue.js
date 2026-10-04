import {snapshotTag} from "./snapshotTag.js";
/**
 * Human-readable one-line descriptions of runtime values (issue #267).
 *
 * `describeValueType` mirrors how TypeScript renders the actual side of its
 * assignability errors: collections read as inferred generics
 * (`Map<string, null>`, `Set<number>`), so the comparator summary stays a
 * true one-liner. Entry-level detail lives where it belongs — the Diagnosis
 * findings, the type tree and the Actual pane (`prettyValue`) — instead of
 * raw `{"$type": "Map", …}` JSON snapshots. Typed arrays, buffers/views,
 * dates, regexps, errors, bigints, promises and class instances get the
 * same treatment instead of their own `$type` snapshots.
 *
 * Dependency-free by design: diagnostics (`explainMismatch`, `typeTree`,
 * `humanizeExpect`) and the validator summary (`inspectType`) all share it
 * without import cycles or browser globals.
 */
const MAX_DESCRIBE_UNION = 5;
const MAX_DESCRIBE_SCAN = 1000;
const MAX_DESCRIBE_CHARS = 1000;
const MAX_PRETTY_ENTRIES = 20;
const MAX_PRETTY_LINE = 200;
/** Max items shown in a typed-array one-liner. */
const MAX_DESCRIBE_ITEMS = 10;
/**
 * Widens a single value to its apparent type: mutable positions widen
 * literals the way TypeScript infers `new Map([['apiKey', null]])` as
 * `Map<string, null>` (not `Map<"apiKey", null>`). Non-primitives keep
 * their structural description.
 * @param {*} value - The value to widen.
 * @param {number} depth - Remaining nesting depth.
 * @returns {string} Apparent type.
 */
function widenedType(value, depth) {
  const kind = typeof value;
  if (kind === 'string') {
    return 'string';
  }
  if (kind === 'number') {
    return 'number';
  }
  if (kind === 'boolean') {
    return 'boolean';
  }
  return describeValueType(value, depth);
}
/**
 * Joins distinct type names into a `|` union, capped at a few members plus
 * a `...` marker (and an overall character cap) so hostile collections
 * can't blow up a one-line summary.
 * @param {string[]} distinct - Distinct type names in encounter order.
 * @param {boolean} truncated - True when not every value was scanned.
 * @returns {string} Union text (`never` when empty).
 */
function unionText(distinct, truncated) {
  const shown = distinct.slice(0, MAX_DESCRIBE_UNION);
  let text = shown.join(' | ') || 'never';
  if (truncated || distinct.length > shown.length) {
    text += shown.length ? ' | ...' : '...';
  }
  if (text.length > MAX_DESCRIBE_CHARS) {
    text = `${text.slice(0, MAX_DESCRIBE_CHARS - 3)}...`;
  }
  return text;
}
/**
 * Infers the `K`/`V` (or `T`) unions of a collection by scanning its
 * entries. Stops scanning after a generous budget — summaries must stay
 * cheap even for hostile maps — and reports the cut honestly via `...`.
 * @param {Iterable} entries - Collection entries (pairs for `Map`).
 * @param {boolean} paired - True for `[key, value]` pairs, false for items.
 * @param {number} depth - Remaining nesting depth.
 * @param {number} size - Total collection size.
 * @returns {[string, string]} `[first, second]` union texts (`second` is `''` unless paired).
 */
function inferUnions(entries, paired, depth, size) {
  const first = [];
  const second = [];
  let scanned = 0;
  /**
   * @param {string[]} list - Distinct list to extend.
   * @param {string} text - Candidate type name.
   */
  const pushDistinct = (list, text) => {
    if (!list.includes(text) && list.length <= MAX_DESCRIBE_UNION) {
      list.push(text);
    }
  };
  for (const entry of entries) {
    if (scanned >= MAX_DESCRIBE_SCAN) {
      break;
    }
    if (paired) {
      pushDistinct(first, widenedType(entry[0], depth - 1));
      pushDistinct(second, widenedType(entry[1], depth - 1));
    } else {
      pushDistinct(first, widenedType(entry, depth - 1));
    }
    scanned++;
  }
  const truncated = size > scanned;
  return [unionText(first, truncated), paired ? unionText(second, truncated) : ''];
}
/**
 * Describes a runtime value as a type, mirroring how TypeScript renders the
 * actual side of its assignability errors (`'"b"'`, `1`, `{sub: string}`,
 * `Map<string, null>`). Depth- and width-capped: detail beyond that lives
 * in the comparator's Diagnosis/tree panes, not in this one-liner.
 * @param {*} value - The actual value.
 * @param {number} depth - Remaining nesting depth.
 * @returns {string} Type-style description.
 */
function describeValueType(value, depth = 2) {
  if (value === null) {
    return 'null';
  }
  if (value === undefined) {
    return 'undefined';
  }
  const kind = typeof value;
  if (kind === 'string' || kind === 'number' || kind === 'boolean') {
    return JSON.stringify(value) ?? kind;
  }
  if (kind === 'bigint') {
    return `${String(value)}n`;
  }
  if (value instanceof Date) {
    if (depth <= 0) {
      return 'Date';
    }
    try {
      return `Date(${JSON.stringify(value.toISOString())})`;
    } catch {
      return 'Date';
    }
  }
  if (value instanceof RegExp) {
    return String(value);
  }
  if (value instanceof Error) {
    let name = 'Error';
    try {
      name = value.name || 'Error';
    } catch {
      // Keep the fallback.
    }
    let message = '';
    try {
      message = value.message ?? '';
    } catch {
      message = '';
    }
    return message ? `${name}: ${message}` : name;
  }
  if (value instanceof DataView) {
    let tag = 'DataView';
    try {
      tag = value.constructor?.name ?? tag;
    } catch {
      // Keep the fallback.
    }
    if (depth <= 0) {
      return tag;
    }
    try {
      return `${tag}(${value.byteLength})`;
    } catch {
      return tag;
    }
  }
  if (ArrayBuffer.isView(value)) {
    let tag = 'ArrayBufferView';
    try {
      tag = value.constructor?.name ?? tag;
    } catch {
      // Keep the fallback.
    }
    if (depth <= 0) {
      return tag;
    }
    let len;
    try {
      len = value.length;
    } catch {
      len = undefined;
    }
    if (typeof len !== 'number') {
      // Cross-realm `DataView` (no `.length`): show the byte size instead.
      try {
        const bytes = value.byteLength;
        if (typeof bytes === 'number') {
          return `${tag}(${bytes})`;
        }
      } catch {
        // Fall through to the bare tag.
      }
      return tag;
    }
    const count = Math.min(len, MAX_DESCRIBE_ITEMS);
    const shown = [];
    for (let i = 0; i < count; i++) {
      shown.push(describeValueType(value[i], depth - 1));
    }
    return `${tag}(${len}) [${shown.join(', ')}${len > count ? ', ...' : ''}]`;
  }
  if (value instanceof ArrayBuffer || (typeof SharedArrayBuffer !== 'undefined' && value instanceof SharedArrayBuffer)) {
    let tag = 'ArrayBuffer';
    try {
      tag = value.constructor?.name ?? tag;
    } catch {
      // Keep the fallback.
    }
    if (depth <= 0) {
      return tag;
    }
    try {
      return `${tag}(${value.byteLength})`;
    } catch {
      return tag;
    }
  }
  if (value instanceof Map) {
    if (kind !== 'object' || depth <= 0) {
      return 'Map';
    }
    const [keys, vals] = inferUnions(value, true, depth, value.size);
    return `Map<${keys}, ${vals}>`;
  }
  if (value instanceof Set) {
    if (kind !== 'object' || depth <= 0) {
      return 'Set';
    }
    const [items] = inferUnions(value, false, depth, value.size);
    return `Set<${items}>`;
  }
  if (value instanceof Promise) {
    return 'Promise';
  }
  if (value instanceof WeakMap) {
    return 'WeakMap';
  }
  if (value instanceof WeakSet) {
    return 'WeakSet';
  }
  if (typeof URL !== 'undefined' && value instanceof URL) {
    if (depth <= 0) {
      return 'URL';
    }
    try {
      return `URL(${JSON.stringify(String(value))})`;
    } catch {
      return 'URL';
    }
  }
  if (typeof Element !== 'undefined' && value instanceof Element) {
    try {
      return `[DOM ${value.tagName}]`;
    } catch {
      return '[DOM]';
    }
  }
  if (kind !== 'object' || depth <= 0) {
    return kind;
  }
  if (value instanceof Array) {
    const shown = value.slice(0, 3).map((element) => describeValueType(element, depth - 1));
    return `[${shown.join(', ')}${value.length > 3 ? ', ...' : ''}]`;
  }
  const proto = Object.getPrototypeOf(value);
  const prefix = proto !== null && proto !== Object.prototype && value.constructor?.name ? `${value.constructor.name} ` : '';
  if (prefix) {
    let keys;
    try {
      keys = Object.keys(value);
    } catch {
      return prefix.trim();
    }
    // Host instances (`Window` and friends) carry hundreds of keys; anything
    // that would not even fit the Actual pane lists as its bare tag instead
    // of an unreadable nested blob, mirroring how TypeScript names them.
    if (keys.length > MAX_PRETTY_ENTRIES) {
      return prefix.trim();
    }
    const shown = keys.slice(0, 5).map((key) => `${key}: ${describeValueType(value[key], depth - 1)}`);
    return `${prefix}{${shown.join(', ')}${keys.length > 5 ? ', ...' : ''}}`;
  }
  const snapshot = snapshotTag(value);
  if (snapshot !== undefined) {
    return describeSnapshot(value, snapshot, depth);
  }
  const keys = Object.keys(value).slice(0, 5);
  const shown = keys.map((key) => `${key}: ${describeValueType(value[key], depth - 1)}`);
  return `{${shown.join(', ')}${Object.keys(value).length > 5 ? ', ...' : ''}}`;
}
/**
 * One-line rendering of a snapshot by its recorded tag: hosts read as
 * their bare tag, containers and buffers add their recorded size.
 * Never throws.
 * @param {*} snapshot - The snapshot object.
 * @param {string} tag - The recorded constructor tag.
 * @param {number} depth - Remaining nesting depth.
 * @returns {string} One-line text.
 */
function describeSnapshot(snapshot, tag, depth) {
  if (depth <= 0) {
    return tag;
  }
  try {
    if (tag === 'bigint') {
      return `${snapshot.value}n`;
    }
    if ((tag === 'Map' || tag === 'Set') && typeof snapshot.size === 'number') {
      return `${tag}(${snapshot.size})`;
    }
    if ((tag === 'ArrayBuffer' || tag === 'SharedArrayBuffer' || tag === 'DataView') &&
        typeof snapshot.byteLength === 'number') {
      return `${tag}(${snapshot.byteLength})`;
    }
    if ((tag.endsWith('Array') || tag === 'Buffer') && typeof snapshot.length === 'number') {
      return `${tag}(${snapshot.length})`;
    }
  } catch {
    // Fall through to the bare tag below.
  }
  return tag;
}
/**
 * Multi-line Actual-pane rendering of a snapshot: containers list their
 * recorded entries, hosts list one `key: value` row per recorded key with
 * nested snapshots collapsing to their tags. Bounded like live rendering.
 * Never throws.
 * @param {*} snapshot - The snapshot object.
 * @param {string} tag - The recorded constructor tag.
 * @returns {string} Multi-line text.
 */
function prettySnapshot(snapshot, tag) {
  try {
    if (tag === 'Map' && Array.isArray(snapshot.entries)) {
      const size = typeof snapshot.size === 'number' ? snapshot.size : snapshot.entries.length;
      const lines = [`${tag}(${size}) {`];
      for (const entry of snapshot.entries.slice(0, MAX_PRETTY_ENTRIES)) {
        lines.push(Array.isArray(entry) ?
          `  ${oneLine(entry[0])} => ${oneLine(entry[1])}` :
          `  ${oneLine(entry)}`);
      }
      lines.push('}');
      return lines.join('\n');
    }
    if (tag === 'Set' && Array.isArray(snapshot.values)) {
      const size = typeof snapshot.size === 'number' ? snapshot.size : snapshot.values.length;
      const lines = [`${tag}(${size}) {`];
      for (const item of snapshot.values.slice(0, MAX_PRETTY_ENTRIES)) {
        lines.push(`  ${oneLine(item)}`);
      }
      lines.push('}');
      return lines.join('\n');
    }
    if ((tag.endsWith('Array') || tag === 'Buffer') && Array.isArray(snapshot.values)) {
      const len = typeof snapshot.length === 'number' ? snapshot.length : snapshot.values.length;
      if (len === 0) {
        return `${tag}(0) []`;
      }
      const lines = [`${tag}(${len}) [`];
      for (const item of snapshot.values.slice(0, MAX_PRETTY_ENTRIES)) {
        lines.push(`  ${oneLine(item)}`);
      }
      lines.push(']');
      return lines.join('\n');
    }
    if (tag === 'bigint' || tag === 'ArrayBuffer' || tag === 'SharedArrayBuffer' || tag === 'DataView') {
      return describeSnapshot(snapshot, tag, 2);
    }
    const keys = Object.keys(snapshot).filter((key) => key !== '$type');
    if (!keys.length) {
      return `${tag} {}`;
    }
    const lines = [`${tag} {`];
    const shown = keys.slice(0, MAX_PRETTY_ENTRIES);
    for (const key of shown) {
      lines.push(`  ${key}: ${oneLine(snapshot[key])}`);
    }
    if (keys.length > shown.length) {
      lines.push(`  ...(+${keys.length - shown.length} more)`);
    }
    lines.push('}');
    return lines.join('\n');
  } catch {
    return tag;
  }
}
/**
 * Bounded one-line description (never throws).
 * @param {*} value - The value to describe.
 * @returns {string} Single-line description.
 */
function oneLine(value) {
  let text;
  try {
    text = describeValueType(value, 2);
  } catch {
    return '[Unreadable]';
  }
  return text.length > MAX_PRETTY_LINE ? `${text.slice(0, MAX_PRETTY_LINE - 3)}...` : text;
}
/**
 * Pretty multi-line rendering of one typed array (`Uint8Array(3) [` plus
 * one row per element), bounded like `Map`/`Set` rendering.
 * @param {*} value - The typed array to render.
 * @param {string} tag - Constructor tag, e.g. `Uint8Array`.
 * @returns {string} Multi-line text.
 */
function prettyTypedArray(value, tag) {
  const len = value.length;
  if (len === 0) {
    return `${tag}(0) []`;
  }
  const lines = [`${tag}(${len}) [`];
  const shown = Math.min(len, MAX_PRETTY_ENTRIES);
  for (let i = 0; i < shown; i++) {
    lines.push(`  ${oneLine(value[i])}`);
  }
  if (len > shown) {
    lines.push(`  ...(+${len - shown} more)`);
  }
  lines.push(']');
  return lines.join('\n');
}
/**
 * Pretty multi-line rendering of one class instance (`Vec3 {` plus one
 * `key: value` row per property), so the Actual pane shows the tag instead
 * of a raw `{"$type": "Vec3", …}` snapshot.
 * @param {*} value - The class instance to render.
 * @param {string} tag - Constructor tag, e.g. `Vec3`.
 * @param {string[]} keys - Own enumerable keys of the instance.
 * @returns {string} Multi-line text.
 */
function prettyClassInstance(value, tag, keys) {
  if (!keys.length) {
    return `${tag} {}`;
  }
  const lines = [`${tag} {`];
  const shown = keys.slice(0, MAX_PRETTY_ENTRIES);
  for (const key of shown) {
    let prop;
    try {
      prop = value[key];
    } catch {
      lines.push(`  ${key}: [Getter threw]`);
      continue;
    }
    lines.push(`  ${key}: ${oneLine(prop)}`);
  }
  if (keys.length > shown.length) {
    lines.push(`  ...(+${keys.length - shown.length} more)`);
  }
  lines.push('}');
  return lines.join('\n');
}
/**
 * Dedicated Actual-pane rendering for every non-`Map`/`Set` `$type` shape.
 * Single-line leaves (`Date("…")`, `TypeError: …`, `123n`,
 * `ArrayBuffer(8)`, …) reuse the one-line description; typed arrays and
 * class instances get bounded multi-line blocks. Returns `undefined` for
 * plain objects, arrays and JSON-native primitives so the JSON snapshot
 * stays untouched. May throw (revoked proxies, throwing getters) — the
 * caller (`prettyValue`) contains it.
 * @param {*} value - The value to render.
 * @returns {string|undefined} Rendering, or `undefined` to keep the JSON snapshot.
 */
function prettyNonCollection(value) {
  if (value === null) {
    return undefined;
  }
  const kind = typeof value;
  if (kind === 'bigint') {
    return `${String(value)}n`;
  }
  if (kind !== 'object') {
    return undefined;
  }
  if (Array.isArray(value)) {
    return undefined;
  }
  const snapshot = snapshotTag(value);
  if (snapshot !== undefined) {
    return prettySnapshot(value, snapshot);
  }
  if (value instanceof Date || value instanceof RegExp || value instanceof Error ||
      value instanceof Promise || value instanceof WeakMap || value instanceof WeakSet ||
      (typeof URL !== 'undefined' && value instanceof URL) ||
      (typeof Element !== 'undefined' && value instanceof Element)) {
    return describeValueType(value, 2);
  }
  if (value instanceof DataView) {
    return describeValueType(value, 2);
  }
  if (ArrayBuffer.isView(value)) {
    let tag = 'ArrayBufferView';
    try {
      tag = value.constructor?.name ?? tag;
    } catch {
      // Keep the fallback.
    }
    if (typeof value.length !== 'number') {
      return describeValueType(value, 2);
    }
    return prettyTypedArray(value, tag);
  }
  if (value instanceof ArrayBuffer || (typeof SharedArrayBuffer !== 'undefined' && value instanceof SharedArrayBuffer)) {
    return describeValueType(value, 2);
  }
  let proto;
  try {
    proto = Object.getPrototypeOf(value);
  } catch {
    return undefined;
  }
  if (proto === Object.prototype || proto === null) {
    return undefined;
  }
  let tag;
  try {
    tag = value.constructor?.name ?? 'Object';
  } catch {
    return undefined;
  }
  if (!tag || tag === 'Object') {
    return undefined;
  }
  let keys;
  try {
    keys = Object.keys(value);
  } catch {
    return undefined;
  }
  // Giant host instances collapse to their one-line tag: a 20-row excerpt
  // of `Window` internals helps nobody in the Actual pane.
  if (keys.length > MAX_PRETTY_ENTRIES) {
    return oneLine(value);
  }
  return prettyClassInstance(value, tag, keys);
}
/**
 * Pretty multi-line rendering for the comparator's Actual pane:
 * `Map`/`Set` render as an entry listing, typed arrays and
 * class instances as bounded blocks, every other `$type` shape as its
 * one-line description — so the pane never falls back to raw
 * `{"$type": …}` JSON. Returns `undefined` for plain objects, arrays and
 * JSON-native primitives so callers keep their existing rendering
 * untouched. Never throws — on any failure (revoked proxies, throwing
 * iterators) the caller falls back to the JSON snapshot.
 * @param {*} value - The value to render.
 * @returns {string|undefined} Multi-line text, or `undefined` to keep the JSON snapshot.
 */
function prettyValue(value) {
  let isMap = false;
  let isSet = false;
  try {
    isMap = value instanceof Map;
    isSet = value instanceof Set;
  } catch {
    return undefined;
  }
  if (!isMap && !isSet) {
    let pretty;
    try {
      pretty = prettyNonCollection(value);
    } catch {
      return undefined;
    }
    return pretty;
  }
  try {
    const size = value.size;
    const tag = isMap ? 'Map' : 'Set';
    if (size === 0) {
      return `${tag}(0) {}`;
    }
    const lines = [`${tag}(${size}) {`];
    let shown = 0;
    if (isMap) {
      for (const [key, val] of value) {
        if (shown >= MAX_PRETTY_ENTRIES) {
          break;
        }
        lines.push(`  ${oneLine(key)} => ${oneLine(val)}`);
        shown++;
      }
    } else {
      for (const item of value) {
        if (shown >= MAX_PRETTY_ENTRIES) {
          break;
        }
        lines.push(`  ${oneLine(item)}`);
        shown++;
      }
    }
    if (size > shown) {
      lines.push(`  ...(+${size - shown} more)`);
    }
    lines.push('}');
    return lines.join('\n');
  } catch {
    return undefined;
  }
}
export {describeValueType, oneLine, prettyValue};
