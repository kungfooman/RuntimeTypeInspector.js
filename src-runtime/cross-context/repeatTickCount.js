/**
 * Extracts the repeat delta of a coalesced checking side message:
 * flushes carry the tick count as `ticks`, legacy senders post one
 * message per tick and bump by one.
 * @param {*} data - The message payload of a repeat tick.
 * @returns {number} Ticks to bump, at least 1.
 * @example repeatTickCount({ticks: 41}) // 41
 */
function repeatTickCount(data) {
  if (data === null || data === undefined) {
    return 1;
  }
  if (!Number.isFinite(data.ticks) || data.ticks < 1) {
    return 1;
  }
  return Math.floor(data.ticks);
}
export {repeatTickCount};
