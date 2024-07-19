/**
 * Works to post messages from inside <iframe>'s and Workers to the parent window,
 * which should be the user interface that can handle/display the messages in an
 * integrated matter.
 * @param {...any} args - The arguments.
 */
function crossContextPostMessage(...args) {
  const to = globalThis.parent || globalThis.self;
  to.postMessage(...args);
}
export {crossContextPostMessage};
