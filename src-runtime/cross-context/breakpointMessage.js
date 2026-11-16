import {buildMessage} from './buildMessage.js';
/**
 * Builds one breakpoint arm or disarm for a checking context: arms
 * travel over the bus for cross context registries (worker, iframe),
 * so the checker that owns the `loc-name` key traps the next failure.
 * @param {string} key - Bare `loc-name` the checking side looks up.
 * @param {boolean} arm - True to arm, false to disarm.
 * @param {string} [destination] - The destination, `worker` by default.
 * @returns {object} Breakpoint message for the checking side.
 * @example breakpointMessage('takeFloat-data', true) // {type: 'rti', ...}
 */
function breakpointMessage(key, arm, destination = 'worker') {
  return buildMessage(arm ? 'addBreakpoint' : 'deleteBreakpoint', destination, {key});
}
export {breakpointMessage};
