import {Warning    } from "./Warning.js";
import {options    } from "./options.js";
import {warnedTable} from "./warnedTable.js";
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
  let warnObj = options.warned[key];
  if (!warnObj) {
    warnObj = new Warning(msg, value, expect, loc, name);
    warnedTable?.append(warnObj.tr);
    options.warned[key] = warnObj;
  }
  warnObj.hits++;
  warnObj.warn(msg, details);
  warnObj.value = value;
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
