import {bestEffort  } from './bestEffort.js';
import {postToTarget} from './postToTarget.js';
/**
 * Sends one envelope to every known peer, skipping dead sinks one
 * by one instead of aborting the fan-out at the first broken bus.
 * Peers answer through `netListen` under their own id, so one
 * broadcast update reaches workers, iframes and pop-outs alike.
 * @param {Iterable<*>} targets - The peer buses to post to.
 * @param {object} message - The envelope to send to each target.
 * @returns {void}
 * @example netFanout([], {net: 'my-app', channel: 'checks', verb: 'ping'});
 */
function netFanout(targets, message) {
  if (targets === null || targets === undefined) {
    return;
  }
  bestEffort(() => {
    for (const target of targets) {
      postToTarget(target, message);
    }
  });
}
export {netFanout};
