import {decodeBase64, encodeBase64} from './base64.js';
const tests = [
  // ASCII stays byte-identical to the plain btoa output
  () => encodeBase64('hello world') === 'aGVsbG8gd29ybGQ=',
  // Emojis survive the round trip (this used to throw on btoa)
  () => decodeBase64(encodeBase64('🤗')) === '🤗',
  // Non-ASCII (3-byte UTF-8) round trip
  () => decodeBase64(encodeBase64('€uro')) === '€uro',
  // Mixed Unicode string round trip
  () => decodeBase64(encodeBase64('Grüße 🌍 漢字')) === 'Grüße 🌍 漢字',
  // An empty string round trips to an empty string
  () => decodeBase64(encodeBase64('')) === '',
  // Legacy Latin1 hash produced by the old `btoa(string)` path still decodes
  () => decodeBase64(btoa('Grüße')) === 'Grüße',
  // Legacy ASCII hash produced by the old path still decodes
  () => decodeBase64(btoa('const x = "hello";')) === 'const x = "hello";',
  // The UTF-8 encoding differs from the legacy Latin1 encoding for non-ASCII
  () => encodeBase64('Grüße') !== btoa('Grüße'),
];
export {tests};
