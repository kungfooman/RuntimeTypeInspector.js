/**
 * Human-readable one-line descriptions of runtime values (issue #267).
 *
 * `describeValueType` mirrors how TypeScript renders the actual side of its
 * assignability errors: collections read as inferred generics
 * (`Map<string, null>`, `Set<number>`), so the comparator summary stays a
 * true one-liner. Entry-level detail lives where it belongs — the Diagnosis
 * findings, the type tree and the Actual pane (`prettyValue`) — instead of
 * raw `{"$type": "Map", …}` JSON snapshots.
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
  if (kind !== 'object' || depth <= 0) {
    return kind;
  }
  if (value instanceof Array) {
    const shown = value.slice(0, 3).map((element) => describeValueType(element, depth - 1));
    return `[${shown.join(', ')}${value.length > 3 ? ', ...' : ''}]`;
  }
  const proto = Object.getPrototypeOf(value);
  const prefix = proto !== null && proto !== Object.prototype && value.constructor?.name ? `${value.constructor.name} ` : '';
  const keys = Object.keys(value).slice(0, 5);
  const shown = keys.map((key) => `${key}: ${describeValueType(value[key], depth - 1)}`);
  return `${prefix}{${shown.join(', ')}${Object.keys(value).length > 5 ? ', ...' : ''}}`;
}
/**
 * Short display form of a `Map` key for `.get(…)` paths and labels:
 * strings stay readable (`'apiKey'`), anything else falls back to a
 * depth-capped one-liner. Never throws.
 * @param {*} key - The map key.
 * @returns {string} Key label.
 */
function formatMapKey(key) {
  if (typeof key === 'string') {
    return `'${key.replace(/'/g, "\\'")}'`;
  }
  try {
    const text = describeValueType(key, 1);
    return text.length > 60 ? `${text.slice(0, 57)}...` : text;
  } catch {
    return '?';
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
 * Pretty multi-line rendering of a `Map`/`Set` for the comparator's Actual
 * pane: a `Map(1) {` header, one `key => value` row per entry, a
 * `...(+N more)` marker past the budget. Returns `undefined` for anything
 * else so callers keep their existing rendering untouched. Never throws —
 * on any failure (revoked proxies, throwing iterators) the caller falls
 * back to the JSON snapshot.
 * @param {*} value - The value to render.
 * @returns {string|undefined} Multi-line text, or `undefined` when not a collection.
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
    return undefined;
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
export {describeValueType, formatMapKey, prettyValue};
