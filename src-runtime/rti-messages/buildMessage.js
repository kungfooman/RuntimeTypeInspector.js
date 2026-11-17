import {buildEnvelope} from '../cross-context/buildEnvelope.js';
/**
 * Builds one UI bound RTI message envelope: the `type` plus the
 * destination stay fixed, every payload field rides along untouched.
 * @param {string} action - The action, e.g. `addError` or `enable`.
 * @param {string} destination - The destination, `ui` or `worker`.
 * @param {object} [payload] - Extra message fields.
 * @returns {object} The message envelope.
 * @example buildMessage('enable', 'worker', {value: true}) // {type: 'rti', ...}
 */
function buildMessage(action, destination, payload = {}) {
  return buildEnvelope('rti', action, destination, payload);
}
export {buildMessage};
