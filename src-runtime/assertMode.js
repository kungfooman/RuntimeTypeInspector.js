/**
 * @returns {asserts mode is typeof import('./options.js').options.mode} asd
 * @param {string} mode - The mode to test.
 */
function assertMode(mode) {
  switch (mode) {
    case 'spam':
    case 'once':
    case 'never':
      return;
  }
  throw new TypeError("wrong mode - either spam, once or never.");
}
export {assertMode};
