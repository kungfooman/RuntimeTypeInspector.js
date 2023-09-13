/**
 * @typedef Stat
 * @property {number} checked
 * @property {number} unchecked
 */

/**
 * @param {Stat} stat - the Stat.
 */
function statReset(stat) {
  stat.checked = 0;
  stat.unchecked = 0;
}

export { statReset };
