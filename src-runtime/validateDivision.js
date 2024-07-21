import {crossContextPostMessage} from './crossContextPostMessage.js';
import {breakpoints            } from './inspectType.js';
import {options                } from './options.js';
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
/**
 * @param {number} lhs - The left hand side.
 * @param {number} rhs - The right hand side.
 * @param {string} loc - Location of division.
 * @example
 * validateDivision( 1 ,  2 ); // Outputs: 0.5
 * validateDivision( 1 , "2"); // Warns: validateDivision> incompatible type pair
 * validateDivision(10n,  2n); // Outputs: 5n
 * @returns {number} The division result.
 */
function validateDivision(lhs, rhs, loc = 'unspecified') {
  if (!options.enabled) {
    return lhs / rhs;
  }
  const twoNumbers = typeof lhs === 'number' && typeof rhs === 'number';
  const twoBigInts = typeof lhs === 'bigint' && typeof rhs === 'bigint';
  const valid = twoNumbers || twoBigInts;
  if (!valid) {
    const expect = {type: 'union', members: ['number', 'bigint']};
    const msg = `validateDivision> incompatible type pair`;
    const details = {lhs, rhs, twoNumbers, twoBigInts};
    validateDivisionAddWarning('would throw', expect, loc, 'division', msg, details);
  }
  const ret = lhs / rhs;
  // If we got two bigint's, we are done, as isNaN and isFinite is only for "normal" numbers.
  if (twoBigInts) {
    return ret;
  }
  if (isNaN(ret)) {
    validateDivisionAddWarning(ret, 'number', loc, 'division', `validateDivision> NaN`, {lhs, rhs});
  }
  if (!isFinite(ret)) {
    const msg = `validateDivision> +-Infinity`;
    validateDivisionAddWarning(ret, 'number', loc, 'division', msg, {lhs, rhs});
  }
  return ret;
}
export {validateDivisionAddWarning, validateDivision};
