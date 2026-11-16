/**
 * Resolves the reply target of a panel bound message event: `source`
 * for worker and iframe traffic, `srcElement` for the worker on
 * message fallback, null when the event carries neither.
 * @param {*} event - The message event from a worker, iframe or window.
 * @returns {*} The reply target, or null when unreachable.
 * @example resolveEventTarget({source: null, srcElement: 'worker'}) // 'worker'
 */
function resolveEventTarget(event) {
  if (event === null || event === undefined) {
    return null;
  }
  if (event.source !== null && event.source !== undefined) {
    return event.source;
  }
  if (event.srcElement !== null && event.srcElement !== undefined) {
    return event.srcElement;
  }
  return null;
}
export {resolveEventTarget};
