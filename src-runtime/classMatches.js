import {snapshotMatches} from './snapshotMatches.js';
/**
 * Whether a snapshot tag names the expected class: exact match or a
 * registered subclass, walked by identity so aliases stay correct. The
 * tag proves instance-hood across messaging (prototypes don't survive),
 * which is what lets the differ tell transport-stripped methods from
 * genuinely missing ones. Never throws.
 * @param {string|undefined} tag - Snapshot tag of the value.
 * @param {string|undefined} className - Expected class name.
 * @returns {boolean} True on a nominal match.
 * @example
 * classMatches('Color', 'Color'); // true (when Color registered)
 * classMatches(undefined, 'Color'); // false
 */
function classMatches(tag, className) {
  if (typeof tag !== 'string') {
    return false;
  }
  return snapshotMatches({$type: tag}, className);
}
export {classMatches};
