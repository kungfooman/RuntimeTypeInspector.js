/**
 * @typedef Stat
 * @property {number} checked - How often assertions were added to this kind of node.
 * @property {number} unchecked - How often no assertions were added to this kind of node.
 */
/**
 * @param {Stat} stat - the Stat.
 */
function statReset(stat) {
  stat.checked = 0;
  stat.unchecked = 0;
}
export {statReset};
