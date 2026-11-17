/**
 * Counts one tick per key into a caller owned map: the unhardcoded
 * core behind repeat coalescing: collapsing
 * any hot loop traffic (progress pings, log repeats, presence beats)
 * from per event to per key per flush. Never throws: the reporting
 * path must survive hostile keys without breaking the sender.
 * @param {Map<string, number>} store - Key to tick count.
 * @param {string} key - The key that ticked.
 * @returns {number} Pending ticks for this key after recording.
 * @example
 * noteKey(new Map(), 'frame'); // 1
 */
function noteKey(store, key) {
  try {
    const next = (store.get(key) ?? 0) + 1;
    store.set(key, next);
    return next;
  } catch {
    return 0;
  }
}
export {noteKey};
