import {classes} from "./registerClass.js";
import {registeredNameOf} from "./registeredNameOf.js";
/**
 * Whether a node needs a `$type` tag: a registered class instance
 * (nominal identity messaging strips) or a typed array / `DataView`
 * (self-identifying for array-branch findings). Plain objects, arrays
 * and natively handled containers (`Map`/`Set`/...) never need one.
 * Constructor-style names only, mirroring what `snapshotTag` filters
 * downstream.
 * @param {*} val - Candidate value.
 * @returns {string|undefined} Tag name or undefined.
 */
function tagName(val) {
  if (!val || (typeof val !== 'object' && typeof val !== 'function')) {
    return undefined;
  }
  let proto;
  try {
    proto = Object.getPrototypeOf(val);
  } catch {
    return undefined;
  }
  if (proto === null || proto === Object.prototype || proto === Array.prototype) {
    return undefined;
  }
  let ctor;
  try {
    ctor = proto.constructor;
  } catch {
    return undefined;
  }
  try {
    if (val instanceof Map || val instanceof Set || val instanceof WeakMap || val instanceof WeakSet ||
      val instanceof Date || val instanceof RegExp || val instanceof ArrayBuffer ||
      val instanceof Promise || val instanceof Error) {
      return undefined;
    }
    if (typeof ArrayBuffer !== 'undefined' && ArrayBuffer.isView(val)) {
      const viewName = typeof ctor === 'function' ? ctor.name : val.constructor?.name;
      return typeof viewName === 'string' && /^[A-Z]/.test(viewName) ? viewName : undefined;
    }
  } catch {
    return undefined;
  }
  const name = registeredNameOf(ctor);
  if (typeof name !== 'string' || !/^[A-Z]/.test(name) || typeof classes[name] !== 'function') {
    return undefined;
  }
  return name;
}
/**
 * Child values of a container for traversal: map entries, set items,
 * array items, else own enumerable values. Never throws.
 * @param {*} node - Container value.
 * @returns {any[]} Child values (possibly empty).
 */
function childrenOf(node) {
  try {
    if (node instanceof Map) {
      const out = [];
      for (const [key, val] of node) {
        out.push(key, val);
      }
      return out;
    }
    if (node instanceof Set) {
      return [...node];
    }
    if (Array.isArray(node)) {
      return node.slice();
    }
    if (node && typeof node === 'object') {
      return Object.keys(node).map((key) => node[key]);
    }
  } catch {
    // Unreadable container: treat as childless.
  }
  return [];
}
/**
 * Deep-clones a postable value for the panel, recording class identity
 * that messaging would otherwise strip: `postMessage` structured-clones,
 * so class instances arrive as plain data and the panel can no longer
 * tell "was a Color, methods stripped in transit" from "never was one".
 * Tagged clones carry `$type` (constructor-style names only, like the log
 * snapshots, so every existing `$type` filter keeps applying); plain
 * objects, arrays and natively handled containers post untouched. Never
 * throws: failures return the input for today's behavior. Detection
 * first: values without taggable nodes return by identity, so plain data
 * pays no extra clone on top of the post itself. Live nodes pair with
 * clone nodes in lockstep (same traversal order both sides); a length
 * mismatch (nondeterministic getter between the two reads) skips that
 * pair instead of mistagging.
 * @param {*} value - Clonable value to snapshot for posting.
 * @returns {*} Tagged clone, or the input when nothing needs tagging.
 * @example
 * const data = {a: 1};
 * tagSnapshot(data) === data; // true: plain data posts untouched
 */
function tagSnapshot(value) {
  try {
    const seen = new WeakSet();
    const fringe = [value];
    let found = false;
    while (fringe.length) {
      const node = fringe.pop();
      if (!node || (typeof node !== 'object' && typeof node !== 'function')) {
        continue;
      }
      try {
        if (seen.has(node)) {
          continue;
        }
        seen.add(node);
      } catch {
        continue;
      }
      try {
        if (tagName(node) !== undefined) {
          found = true;
          break;
        }
      } catch {
        continue;
      }
      fringe.push(...childrenOf(node));
    }
    if (!found) {
      return value;
    }
    const clone = structuredClone(value);
    const paired = new WeakSet();
    const pending = [[value, clone]];
    while (pending.length) {
      const [live, copy] = pending.pop();
      if (!live || !copy || (typeof live !== 'object' && typeof live !== 'function')) {
        continue;
      }
      try {
        if (paired.has(live)) {
          continue;
        }
        paired.add(live);
      } catch {
        continue;
      }
      let name;
      try {
        name = tagName(live);
      } catch {
        continue;
      }
      if (name !== undefined) {
        try {
          copy.$type = name;
        } catch {
          continue;
        }
      }
      let liveKids = [];
      let copyKids = [];
      try {
        liveKids = childrenOf(live);
        copyKids = childrenOf(copy);
      } catch {
        continue;
      }
      if (liveKids.length !== copyKids.length) {
        continue;
      }
      for (let i = 0; i < liveKids.length; i++) {
        pending.push([liveKids[i], copyKids[i]]);
      }
    }
    return clone;
  } catch {
    return value;
  }
}
export {tagSnapshot};
