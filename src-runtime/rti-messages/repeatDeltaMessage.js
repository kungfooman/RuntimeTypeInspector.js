import {buildMessage} from './buildMessage.js';
/**
 * Builds one coalesced repeat message: the checking side counts hot
 * loop ticks per key and flushes one delta per key per turn, so the
 * panel bumps hits by the delta instead of by per check arrivals.
 * @param {string} key - Bare `loc-name` of the repeated failure.
 * @param {number} ticks - Ticks accumulated since the last flush.
 * @param {string} [destination] - The destination, `ui` by default.
 * @returns {object} Coalesced repeat message.
 * @example repeatDeltaMessage('takeFloat-data', 41) // {type: 'rti', ...}
 */
function repeatDeltaMessage(key, ticks, destination = 'ui') {
  return buildMessage('addError', destination, {
    key,
    repeat: true,
    ticks,
  });
}
export {repeatDeltaMessage};
