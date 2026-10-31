import {snapshotMatches} from './snapshotMatches.js';
import {snapshotTag} from './snapshotTag.js';
import {unwrapTransparent} from './unwrapTransparent.js';
/**
 * Nominal union accept: a tagged snapshot names its class, and
 * materialization may have erased that name everywhere else, so a tag
 * match on any unwrapped member accepts outright. Members arrive wrapped
 * in runtime-transparent utilities (`Readonly<Color>` wins the harvest
 * over the setter's `Color`), so the match unwraps them first. Plain tag
 * equality covers a panel registry without the engine classes (the tag is
 * the checker's nominal witness); `snapshotMatches` additionally covers
 * registered subclasses where the registry is present.
 * @param {*} value - The actual value.
 * @param {any[]} members - The union members, already sliced to budget.
 * @returns {boolean} True when a member accepts the tag nominally.
 * @example
 * unionNominalTag({$type: 'Color', r: 1}, ['Color', {type: 'array', elementType: 'number'}]); // true
 * unionNominalTag({r: 1}, ['Color']); // false
 */
function unionNominalTag(value, members) {
  const tag = snapshotTag(value);
  if (typeof tag !== 'string') {
    return false;
  }
  for (const member of members) {
    const name = unwrapTransparent(member);
    if (typeof name === 'string' && (tag === name || snapshotMatches(value, name))) {
      return true;
    }
  }
  return false;
}
export {unionNominalTag};
