/**
 * Selects the key expression for the name-preserving overload wrapper.
 * Both the opening property and the closing lookup spell the same key:
 * the captured expression for computed keys, the quoted name otherwise.
 * @param {string|null} dynamicKey - Captured computed key, if dynamic.
 * @param {string|null} arrowName - Inferred arrow name, if static.
 * @returns {string} Key expression shared by the wrapper pair.
 * @example
 * overloadNameKey(null, 'greet'); // '["greet"]'
 */
function overloadNameKey(dynamicKey, arrowName) {
  if (dynamicKey) {
    return `[${dynamicKey}]`;
  }
  const quoted = JSON.stringify(arrowName);
  return `[${quoted}]`;
}
export {overloadNameKey};
