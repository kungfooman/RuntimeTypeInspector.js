import {bestEffort       } from './bestEffort.js';
import {netEnvelope      } from './netEnvelope.js';
import {resolvePostTarget} from './resolvePostTarget.js';
/**
 * Posts one envelope on a network: builds it, stamps the sender,
 * targets the cross context host (embedding parent when framed,
 * otherwise the current scope) and never throws. A missing or
 * broken bus degrades into a lost message, never into a broken
 * sender. Extra arguments ride along untouched (transfer lists).
 * @param {object} fields - Envelope fields (see `netEnvelope`).
 * @returns {object} The envelope as posted.
 * @example netPost({net: 'my-app', channel: 'checks', verb: 'frame', from: 'a'}) // {...}
 */
function netPost(fields) {
  const message = netEnvelope(fields);
  bestEffort(() => resolvePostTarget()?.postMessage?.(message));
  return message;
}
export {netPost};
