/**
 * Escapes a display name for the single-quoted literal of an emitted
 * `inspectType` call. Double quotes travel raw; backslashes, single
 * quotes and line terminators (`\n`, `\r`, U+2028, U+2029) escape, so
 * every name stays valid output syntax on one line. Call it directly on
 * every interpolated name; code slots travel raw. This is the only place
 * that knows about literal escaping: name builders return plain
 * human-readable text.
 * @example
 * escapeName('BitPacking.set'); // "BitPacking.set"
 * escapeName("o[\"ap's\"]"); // "o[\"ap\\'s\"]"
 * @param {string} name - The display name.
 * @returns {string} The escaped name without surrounding quotes.
 */
function escapeName(name) {
  return String(name)
    .replaceAll("\\", "\\\\")
    .replaceAll("'", "\\'")
    .replaceAll("\n", "\\n")
    .replaceAll("\r", "\\r")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");
}
export {escapeName};
