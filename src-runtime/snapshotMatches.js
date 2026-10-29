import {classes} from "./registerClass.js";
import {snapshotTag} from "./snapshotTag.js";
/**
 * Whether a value's snapshot tag names the expected class: exact match or
 * a registered subclass, walked by identity so aliases stay correct. The
 * tag proves instance-hood across messaging (prototypes don't survive),
 * which lets validation accept transport-stripped instances the same way
 * the differ tells their missing methods from genuine defects.
 * @param {*} value - The value to check.
 * @param {string} className - Expected class name.
 * @returns {boolean} True on a nominal tag match.
 * @example
 * // input: {r: 1, $type: 'Color'}
 * snapshotMatches({r: 1, $type: 'Color'}, 'Color');
 * // true
 */
function snapshotMatches(value, className) {
  try {
    const tag = snapshotTag(value);
    if (typeof tag !== 'string' || typeof className !== 'string') {
      return false;
    }
    const target = classes[className];
    if (typeof target !== 'function') {
      return false;
    }
    if (tag === className) {
      return true;
    }
    let ctor = classes[tag];
    for (let i = 0; i < 32 && typeof ctor === 'function' && ctor !== Object; i++) {
      if (ctor === target) {
        return true;
      }
      ctor = Object.getPrototypeOf(ctor);
    }
  } catch {
    // Unreadable registry or exotic prototype: stay strict.
  }
  return false;
}
export {snapshotMatches};
