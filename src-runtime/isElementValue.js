/**
 * Realm-safe element check: `instanceof Element` fails across realms
 * (pop-out windows, iframes) because each realm has its own `Element`
 * constructor, and it throws in Node where `Element` is undefined. The
 * `nodeType` tag and the `closest`/`tagName` shape survive both, so the
 * fake DOM stand-ins in specs keep passing too. Never throws: unreadable
 * host objects fail closed.
 * @param {*} value - The value to test.
 * @returns {value is Element & {tag?: unknown}} True for DOM elements from any realm.
 * @example
 * isElementValue({nodeType: 1, tagName: 'DIV', closest() { return null; }}); // true
 * isElementValue(null); // false
 */
function isElementValue(value) {
  if (value === null || value === undefined) {
    return false;
  }
  if (typeof value !== 'object' && typeof value !== 'function') {
    return false;
  }
  try {
    if (typeof value.closest !== 'function') {
      return false;
    }
    if (value.nodeType === 1) {
      return true;
    }
    const tag = value.tagName ?? value.tag;
    return typeof tag === 'string';
  } catch {
    return false;
  }
}
export {isElementValue};
