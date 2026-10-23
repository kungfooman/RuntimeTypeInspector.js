/**
 * Tagged template for an emitted `inspectType` line: the tag sits in
 * front of the whole template string and escapes every interpolated
 * value in place. Code and quotes stay in the template itself; only
 * display names are wrapped (`'${[loc]}'`), so adding a slot can never
 * leak a raw value.
 * @example
 * quoteName`if (!inspectType(a, "number", '${['BitPacking.set']}', 'a')) {`; // "if (!inspectType(a, \"number\", 'BitPacking.set', 'a')) {"
 * @param {TemplateStringsArray} strings - The literal template chunks.
 * @param {...any} values - Interpolated chunks; arrays escape as names.
 * @returns {string} The assembled line with every name escaped in place.
 */
function quoteName(strings, ...values) {
  const escape = (value) => String(value)
    .replaceAll("\\", "\\\\")
    .replaceAll("'", "\\'")
    .replaceAll("\n", "\\n")
    .replaceAll("\r", "\\r")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");
  return strings.reduce((out, chunk, i) => {
    if (i >= values.length) {
      return out + chunk;
    }
    const value = values[i];
    if (Array.isArray(value)) {
      return out + chunk + escape(value[0]);
    }
    return out + chunk + value;
  }, '');
}
export {quoteName};
