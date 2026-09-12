/**
 * Unicode-safe base64 encoding/decoding.
 *
 * Standard `btoa`/`atob` only handle the Latin1 range. These helpers encode
 * strings as UTF-8 first (via `TextEncoder`) and decode with a strict UTF-8
 * pass. When the strict pass fails (legacy Latin1 hashes produced by the old
 * `btoa(string)` codepath), the decoder falls back to a raw byte interpretation
 * so those older links keep working.
 */

/**
 * @param {string} text - Arbitrary Unicode string.
 * @returns {string} Base64 representation of the UTF-8 bytes of `text`.
 */
function encodeBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * @param {string} base64 - Base64 encoded string (UTF-8 **or** legacy Latin1).
 * @returns {string} The decoded string.
 */
function decodeBase64(base64) {
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
  try {
    return new TextDecoder('utf-8', {fatal: true}).decode(bytes);
  } catch {
    // The hash was produced by the old btoa(string) Latin1 path – just return
    // the raw string so that legacy URL links keep working.
    return binary;
  }
}

export {encodeBase64, decodeBase64};
