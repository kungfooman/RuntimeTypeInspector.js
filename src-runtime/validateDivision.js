import {options                } from './options.js';
import {validateDivisionAddWarning} from './validateDivisionAddWarning.js';
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
export {validateDivision};
