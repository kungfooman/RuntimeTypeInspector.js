/**
 * Quotes a display name for the single-quoted literal of an emitted
 * `inspectType` call. Double quotes travel raw, backslashes double,
 * single quotes escape as `\'`, so every name stays valid output
 * syntax. This is the only place that knows about literal escaping:
 * name builders return plain human-readable text.
 * @example
 * quoteName('BitPacking.set'); // "'BitPacking.set'"
 * quoteName("o[\"ap's\"]"); // "'o[\"ap\\'s\"]'"
 * @param {string} name - The display name.
 * @returns {string} The quoted literal including its quotes.
 */
function quoteName(name) {
  return `'${name.replaceAll("\\", "\\\\").replaceAll("'", "\\'")}'`;
}
export {quoteName};
