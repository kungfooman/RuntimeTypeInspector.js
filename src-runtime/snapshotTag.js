/**
 * Names `stringifyValue` snapshots: values that cannot cross into the UI
 * (host objects, instances with methods, containers holding functions)
 * arrive as plain objects carrying their recorded constructor tag, since
 * the live reference cannot survive messaging. Only constructor-style tags
 * count, so genuine data keys in the same shape keep expanding normally.
 * The plain-object gate is realm-safe: a snapshot shared live across an
 * iframe boundary keeps its home realm's `Object.prototype`, which is not
 * ours but is still a root prototype (its own prototype is null), while a
 * class instance's prototype chain runs deeper. `Object.create(null)`
 * still counts as plain.
 * @param {*} value - The value to inspect.
 * @returns {string|undefined} Snapshot tag, or undefined for live values.
 * @example
 * snapshotTag({$type: 'Color', r: 1}); // 'Color'
 * snapshotTag({r: 1}); // undefined
 */
function snapshotTag(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }
  let proto;
  try {
    proto = Object.getPrototypeOf(value);
  } catch {
    return undefined;
  }
  if (proto !== null) {
    let parent;
    try {
      parent = Object.getPrototypeOf(proto);
    } catch {
      return undefined;
    }
    if (parent !== null) {
      return undefined;
    }
  }
  let tag;
  try {
    tag = value.$type;
  } catch {
    return undefined;
  }
  if (typeof tag !== 'string' || (tag !== 'bigint' && !/^[A-Z]/.test(tag))) {
    return undefined;
  }
  return tag;
}
export {snapshotTag};
