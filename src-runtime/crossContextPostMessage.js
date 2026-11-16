import {options} from './options.js';
/**
 * Works to post messages from inside <iframe>'s and Workers to the parent window,
 * which should be the user interface that can handle/display the messages in an
 * integrated matter. Every `type: 'rti'` message carries this evaluation's
 * `source` id (see `options.runtimeId`), so one panel can attribute rows to
 * the runtime that checked them instead of blending registries silently.
 * A caller-set `source` always wins, so tests and forwarders keep theirs.
 * @param {...any} args - The arguments.
 */
function crossContextPostMessage(...args) {
  const to = globalThis.parent || globalThis.self;
  const [first] = args;
  if (first && typeof first === 'object' && first.type === 'rti' && first.source === undefined) {
    first.source = options.runtimeId;
  }
  to.postMessage(...args);
}
export {crossContextPostMessage};
