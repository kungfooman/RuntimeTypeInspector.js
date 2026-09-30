/**
 * Captures posted RTI messages while `fn` runs, then restores `self`.
 * @param {Function} fn - Code triggering messages.
 * @returns {object[]} Captured messages.
 */
function captureMessages(fn) {
  const prevSelf = globalThis.self;
  const captured = [];
  globalThis.self = {addEventListener: () => {}, postMessage: (msg) => captured.push(msg)};
  try {
    fn();
  } finally {
    globalThis.self = prevSelf;
  }
  return captured.filter((_) => _?.type === 'rti' && _.action === 'addError');
}
export {captureMessages};
