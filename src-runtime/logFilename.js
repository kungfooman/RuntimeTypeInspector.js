/**
 * Builds a short, distinguishable filename for the downloaded error log:
 * the last URL path segment (usually the example name), sanitized and
 * capped, so many saved logs stay apart without `rti-errors (1).json`.
 * @param {string} [href] - The page URL (`location.href`).
 * @returns {string} Filename like `rti-errors-animation_blend-trees-1d.json`.
 * @example logFilename('http://x/iframe/animation_blend-trees-1d.html') // 'rti-errors-animation_blend-trees-1d.json'
 */
export function logFilename(href) {
  try {
    const raw = new URL(href ?? '', 'http://localhost').pathname.split('/').filter(Boolean).pop() ?? '';
    let stem = raw;
    try {
      stem = decodeURIComponent(raw);
    } catch {
      // Malformed escapes: sanitize the raw segment instead.
    }
    const slug = stem.replace(/\.[a-z0-9]+$/i, '').replace(/[^a-z0-9_-]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 60);
    return `rti-errors-${slug || 'log'}.json`;
  } catch {
    return 'rti-errors.json';
  }
}
