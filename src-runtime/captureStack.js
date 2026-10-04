/**
 * Captures the current stack like the console shows it for warnings,
 * bounded so deep stacks can't bloat the log. Shared by the checking side
 * (real call site, captured synchronously at the check) and the panel
 * fallback (message-handling time, when the call site is already gone).
 * @param {number} [maxFrames] - Kept frames besides the `Error` header line.
 * @returns {string[]} Stack lines, oldest dropped past the cap.
 * @example
 * const stack = captureStackLines();
 * crossContextPostMessage({type: 'rti', action: 'addError', key, stack});
 */
function captureStackLines(maxFrames = 20) {
  const lines = (new Error().stack ?? '').split('\n');
  if (lines.length > maxFrames + 1) {
    return [...lines.slice(0, maxFrames + 1), `... (+${lines.length - maxFrames - 1} more frames)`];
  }
  return lines;
}
export {captureStackLines};
