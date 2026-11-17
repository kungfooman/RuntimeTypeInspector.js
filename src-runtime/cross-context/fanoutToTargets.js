import {bestEffort  } from './bestEffort.js';
import {postToTarget} from './postToTarget.js';
/**
 * Fans one worker bound message out to every known checking context,
 * skipping dead sinks one by one instead of aborting the fan out at
 * the first broken bus.
 * @param {Iterable<*>} targets - The event sources to post to.
 * @param {object} message - The message to post to each target.
 * @returns {void}
 * @example
 * fanoutToTargets([], {net: 'net'});
 */
function fanoutToTargets(targets, message) {
  if (targets === null || targets === undefined) {
    return;
  }
  bestEffort(() => {
    for (const target of targets) {
      postToTarget(target, message);
    }
  });
}
export {fanoutToTargets};
