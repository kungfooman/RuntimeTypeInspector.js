/**
 * Serializes any value into JSON-safe structured data for error logs.
 * The hard parts of logging real values, handled here:
 * - circular references become `[Circular ~path]` instead of throwing,
 * - size is strictly bounded (depth, breadth, string length and total node
 *   budget), so hostile values can't produce megabytes of log,
 * - values `JSON.stringify` chokes on (`bigint`, `undefined`, functions,
 *   symbols) become explicit markers instead of throws or silent drops,
 * - throwing getters and revoked proxies become markers instead of throws,
 * - useful shapes survive: class tag via `$type`, `Map`/`Set`/typed arrays
 *   as bounded content, `ArrayBuffer`/`Promise`/DOM as tags.
 * @param {*} value - The value to serialize.
 * @param {object} options - Budgets.
 * @param {number} options.maxDepth - Max nesting depth, defaults to 5.
 * @param {number} options.maxBreadth - Max keys/items per level, defaults to 20.
 * @param {number} options.maxString - Max string length, defaults to 200.
 * @param {number} options.maxNodes - Max total visited nodes, defaults to 1000.
 * @returns {*} JSON-safe structured data.
 */
function stringifyValue(value, options = {}) {
  const maxDepth = options.maxDepth ?? 5;
  const maxBreadth = options.maxBreadth ?? 20;
  const maxString = options.maxString ?? 200;
  const maxNodes = options.maxNodes ?? 1000;
  let nodes = 0;
  /** @type {{obj: object, path: string}[]} */
  const seen = [];
  /**
   * @param {*} val - Current value.
   * @param {number} depth - Current depth.
   * @param {string} path - JSON-pointer-ish path for circular refs.
   * @returns {*} Serialized value.
   */
  function walk(val, depth, path) {
    if (++nodes > maxNodes) {
      return '[Max nodes]';
    }
    let type;
    try {
      type = typeof val;
    } catch {
      return '[Revoked Proxy]';
    }
    if (val === null) {
      return null;
    }
    if (type === 'number' || type === 'boolean') {
      return val;
    }
    if (type === 'string') {
      if (val.length > maxString) {
        return val.slice(0, maxString) + `... (+${val.length - maxString} chars)`;
      }
      return val;
    }
    if (type === 'undefined') {
      return '[undefined]';
    }
    if (type === 'bigint') {
      return {$type: 'bigint', value: String(val)};
    }
    if (type === 'function') {
      return `[Function ${val.name || 'anonymous'}]`;
    }
    if (type === 'symbol') {
      return val.description === undefined ? '[Symbol]' : `[Symbol ${val.description}]`;
    }
    if (depth >= maxDepth) {
      return '[Max depth]';
    }
    const circular = seen.find((entry) => entry.obj === val);
    if (circular) {
      return `[Circular ~${circular.path}]`;
    }
    try {
      if (val instanceof Date) {
        return val.toISOString();
      }
      if (val instanceof Error) {
        return {$type: val.name || 'Error', message: val.message};
      }
      if (val instanceof RegExp) {
        return String(val);
      }
      if (typeof Element !== 'undefined' && val instanceof Element) {
        return `[DOM ${val.tagName}]`;
      }
      if (val instanceof ArrayBuffer) {
        return {$type: 'ArrayBuffer', byteLength: val.byteLength};
      }
      if (ArrayBuffer.isView(val)) {
        const tag = val.constructor?.name ?? 'ArrayBufferView';
        if (val instanceof DataView) {
          return {$type: tag, byteLength: val.byteLength};
        }
        const length = val.length;
        const count = Math.min(length, maxBreadth);
        const values = [];
        for (let i = 0; i < count; i++) {
          values.push(walk(val[i], depth + 1, `${path}[${i}]`));
        }
        if (length > count) {
          values.push(`[...+${length - count} more]`);
        }
        return {$type: tag, length, values};
      }
      if (val instanceof Map) {
        const entries = [...val.entries()];
        const count = Math.min(entries.length, maxBreadth);
        const out = [];
        for (let i = 0; i < count; i++) {
          out.push([walk(entries[i][0], depth + 1, `${path}[${i}][0]`), walk(entries[i][1], depth + 1, `${path}[${i}][1]`)]);
        }
        if (entries.length > count) {
          out.push(`[...+${entries.length - count} more]`);
        }
        return {$type: 'Map', size: val.size, entries: out};
      }
      if (val instanceof Set) {
        const items = [...val.values()];
        const count = Math.min(items.length, maxBreadth);
        const values = [];
        for (let i = 0; i < count; i++) {
          values.push(walk(items[i], depth + 1, `${path}[${i}]`));
        }
        if (items.length > count) {
          values.push(`[...+${items.length - count} more]`);
        }
        return {$type: 'Set', size: val.size, values};
      }
      if (val instanceof Promise) {
        return '[Promise]';
      }
      if (Array.isArray(val)) {
        seen.push({obj: val, path});
        const out = [];
        const count = Math.min(val.length, maxBreadth);
        for (let i = 0; i < count; i++) {
          let item;
          try {
            item = val[i];
          } catch {
            out.push('[Unreadable]');
            continue;
          }
          out.push(walk(item, depth + 1, `${path}[${i}]`));
        }
        if (val.length > count) {
          out.push(`[...+${val.length - count} more]`);
        }
        seen.pop();
        return out;
      }
      const out = {};
      let tag;
      try {
        tag = val.constructor?.name;
      } catch {
        tag = undefined;
      }
      if (tag && tag !== 'Object') {
        out.$type = tag;
      }
      seen.push({obj: val, path});
      const stringKeys = Object.keys(val);
      const symbolKeys = Object.getOwnPropertySymbols(val);
      const labels = [...stringKeys, ...symbolKeys.map((sym) => (sym.description === undefined ? '[Symbol]' : `[Symbol ${sym.description}]`))];
      const count = Math.min(labels.length, maxBreadth);
      for (let i = 0; i < count; i++) {
        const key = labels[i];
        let prop;
        try {
          prop = i < stringKeys.length ? val[stringKeys[i]] : val[symbolKeys[i - stringKeys.length]];
        } catch {
          out[key] = '[Getter threw]';
          continue;
        }
        out[key] = walk(prop, depth + 1, `${path}.${key}`);
      }
      if (labels.length > count) {
        out['[...+N more keys]'] = `${labels.length - count} more keys`;
      }
      seen.pop();
      return out;
    } catch {
      return '[Unreadable]';
    }
  }
  return walk(value, 0, '');
}
export {stringifyValue};
