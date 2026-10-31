import {classMatches} from './classMatches.js';
import {snapshotTag} from './snapshotTag.js';
import {unwrapTransparent} from './unwrapTransparent.js';
/**
 * Nominal match for the method check: a tagged snapshot that names the
 * expected class lost its methods in transit, so their absence is
 * transport, not defect. Untagged values stay strict. Plain tag equality
 * (not just the registry-backed `classMatches`) covers a panel registry
 * without the engine classes: the bare-string top-of-function shortcut
 * trusts the tag alone, and the same trust applies once the name
 * materialized into a shape. The expected name unwraps runtime-transparent
 * utilities first (`Readonly<Color>` is what the harvest spells for
 * getter/setter pairs; the tag stays bare `Color`).
 * @param {*} value - The actual value.
 * @param {*} expect - The unresolved expected type.
 * @returns {boolean} True when a snapshot tag names the expected class.
 * @example
 * snapshotNominalMatch({$type: 'Color', r: 1}, 'Color'); // true
 * snapshotNominalMatch({r: 1}, 'Color'); // false
 */
function snapshotNominalMatch(value, expect) {
  const snapshot = snapshotTag(value);
  if (snapshot === undefined) {
    return false;
  }
  const rawName = typeof expect === 'string' ? expect :
    (expect && typeof expect === 'object' && typeof expect.type === 'string' ? expect.type : undefined);
  const className = unwrapTransparent(rawName);
  return snapshot === className || classMatches(snapshot, className);
}
export {snapshotNominalMatch};
