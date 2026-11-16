import {repeatTickCount} from './repeatTickCount.js';
import {panelMessageKey} from './panelMessageKey.js';
/**
 * Folds one checking side repeat tick into a panel row: the full
 * report already sits under this key, so only the hit count advances
 * by the coalesced delta, never by per check arrivals.
 * @param {Map<string, {hits: number}>|object} rows - Panel rows by key.
 * @param {*} data - The message payload of the repeat tick.
 * @param {string} runtimeId - Identity of this runtime evaluation.
 * @returns {string|null} Panel key bumped, or null when unknown.
 * @example applyRepeatDelta(new Map([['k', {hits: 1}]]), {key: 'k', ticks: 41}, 'abc') // 'k'
 */
function applyRepeatDelta(rows, data, runtimeId) {
  if (data === null || data === undefined) {
    return null;
  }
  const key = panelMessageKey(data.key, data.source, runtimeId);
  const get = typeof rows.get === 'function' ? (storeKey) => rows.get(storeKey) : (storeKey) => rows[storeKey];
  const known = get(key);
  if (!known) {
    return null;
  }
  known.hits += repeatTickCount(data);
  return key;
}
export {applyRepeatDelta};
