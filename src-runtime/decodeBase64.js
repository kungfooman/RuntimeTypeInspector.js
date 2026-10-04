/**
 * Unicode-safe base64 decoding with a legacy fallback: strings decode
 * with a strict UTF-8 pass, and when that fails (legacy Latin1 hashes
 * produced by the old `btoa(string)` codepath) the decoder falls back to
 * a raw byte interpretation so those older links keep working.
 * @param {string} base64 - Base64 encoded string (UTF-8 **or** legacy Latin1).
 * @returns {string} The decoded string.
 * @example
 * decodeBase64('aGk='); // 'hi'
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
export {decodeBase64};
