import {crossContextPostMessage} from './crossContextPostMessage.js';
import {breakpoints            } from './inspectType.js';
/**
 * @param {*} value - The actual value that we need to validate.
 * @param {*} expect - The supposed type information of said value.
 * @param {string} loc - Using this.filename if division is in global context.
 * @param {string} name - Not a function argument name anymore, we need it
 * anyway for key generation (for state saving/loading)
 * @param {string} msg - The message.
 * @param {object} details - Object with some local details for quick devtools checking.
 */
function validateDivisionAddWarning(value, expect, loc, name, msg, details) {
  const key = `${loc}-${name}`;
  if (breakpoints.has(key)) {
    // console.log("breakpoints", breakpoints);
    debugger;
    breakpoints.delete(key); // trigger only once to quickly get app running again
    crossContextPostMessage({type: 'rti', action: 'deleteBreakpoint', destination: 'ui', key});
  }
  const strings = [msg];
  crossContextPostMessage({
    type: 'rti',
    action: 'addError',
    destination: 'ui',
    value, expect, loc, name, strings, /*valueToString, extras,*/ key,
    // validateDivision specific:
    // msg,
    details, // not handled in TypePanel
  });
}
export {validateDivisionAddWarning};
