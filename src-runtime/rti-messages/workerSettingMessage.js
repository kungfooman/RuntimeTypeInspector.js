import {buildMessage} from './buildMessage.js';
/**
 * Builds one worker bound setting message: the panel fans option
 * traffic out under the `worker` destination, and the checking side
 * applies it keyed by action.
 * @param {string} action - The setting action, e.g. `windowedChecks`.
 * @param {*} value - The setting value.
 * @returns {object} Worker bound setting message.
 * @example workerSettingMessage('checkStats', false) // {type: 'rti', ...}
 */
function workerSettingMessage(action, value) {
  return buildMessage(action, 'worker', {value});
}
export {workerSettingMessage};
