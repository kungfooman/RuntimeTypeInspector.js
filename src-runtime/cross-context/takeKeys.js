/**
 * Drains pending per key ticks: each entry carries its key plus how
 * many ticks accumulated since the last flush, so the receiver adds
 * the delta instead of replaying per event arrivals.
 * @param {Map<string, number>} store - Key to tick count.
 * @returns {Map<string, number>} Key to tick count, empty when nothing pends.
 * @example takeKeys(new Map([['frame', 2]])) // Map { 'frame' => 2 }
 */
function takeKeys(store) {
  try {
    const out = new Map(store);
    store.clear();
    return out;
  } catch {
    return new Map();
  }
}
export {takeKeys};
