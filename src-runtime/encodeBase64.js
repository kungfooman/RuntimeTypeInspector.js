/**
 * Unicode-safe base64 encoding: standard `btoa` only handles the Latin1
 * range, so strings encode as UTF-8 first (via `TextEncoder`).
 * @param {string} text - Arbitrary Unicode string.
 * @returns {string} Base64 representation of the UTF-8 bytes of `text`.
 * @example
 * encodeBase64('hi'); // 'aGk='
 */
function encodeBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
export {encodeBase64};
