import {stringifyValue} from "./stringifyValue.js";
/**
 * One-line human preview of any value for logs and messages: the structured
 * snapshot flattened to JSON and truncated, so logs never show bare
 * `[object Object]`. Never throws; falls back to `String()`.
 * @param {*} value - The value to preview.
 * @param {number} maxLength - Max characters before truncation.
 * @returns {string} Single-line preview.
 * @example
 * previewValue({a: 1}); // '{"a":1}'
 */
function previewValue(value, maxLength = 500) {
  let text;
  try {
    text = JSON.stringify(stringifyValue(value)) ?? String(value);
  } catch {
    try {
      text = String(value?.toString?.() ?? value);
    } catch {
      text = '[Unreadable]';
    }
  }
  return text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text;
}
export {previewValue};
