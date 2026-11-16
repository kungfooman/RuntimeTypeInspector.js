import {bestEffort} from './bestEffort.js';
/**
 * Posts to a bus without ever throwing, for hot loop reporting paths
 * where a broken bus must degrade into lost counts, never into a
 * broken check. Extra arguments ride along untouched, so worker
 * style multi argument posts keep working through the choke point.
 * @param {*} target - The bus carrying `postMessage`.
 * @param {...any} args - The arguments to post.
 * @returns {void}
 * @example
 * postToTarget({postMessage() {}}, {type: 'rti'});
 */
function postToTarget(target, ...args) {
  if (target === null || target === undefined) {
    return;
  }
  if (typeof target.postMessage !== 'function') {
    return;
  }
  bestEffort(() => target.postMessage(...args));
}
export {postToTarget};
