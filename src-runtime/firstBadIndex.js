import {options} from "./options.js";
import {validators} from "./validators.js";
import {validateNumber} from "./validateNumber.js";
import {validateString} from "./validateString.js";
import {validateBoolean} from "./validateBoolean.js";
/**
 * Scans an array-like range for the first element a primitive check would
 * reject, without building per-element names or recursing: `number`
 * mirrors `validateNumber` exactly (`typeof`, `NaN`, `Infinity` unless
 * `options.checkInfinity` is `false`), `string`/`boolean` are `typeof`
 * checks like their validators. The fast path only applies while the
 * `validators` table still holds the originals — a userland override
 * falls back to 0, so overrides keep composing through the full loop.
 * Anything else returns 0 too: scan nothing and let the caller's full
 * loop run from the start, which is today's behavior with zero divergence
 * risk. Callers run their standard loop from the returned index, so
 * warnings and results are identical and only the proven-clean prefix
 * is skipped.
 * @param {*} value - The array-like container.
 * @param {number} length - Validated integer length.
 * @param {*} elementType - Bare primitive name or anything else.
 * @returns {number} First suspect index, -1 when the whole range is clean.
 * @example
 * firstBadIndex([1, 'x', 3], 3, 'number'); // 1
 * firstBadIndex([1, 2, 3], 3, 'number'); // -1
 * firstBadIndex([1, 2, 3], 3, 'Date'); // 0
 */
function firstBadIndex(value, length, elementType) {
  // Without a registered pipeline the full loop throws helpfully; the
  // scan cannot reproduce that, so it stays out of the way.
  if (validators.validateType === undefined) {
    return 0;
  }
  if (elementType === 'number' && validators.validateNumber === validateNumber) {
    const checkInfinity = options.checkInfinity !== false;
    for (let i = 0; i < length; i++) {
      const element = value[i];
      if (typeof element !== 'number' || Number.isNaN(element) ||
        (checkInfinity && !Number.isFinite(element))) {
        return i;
      }
    }
    return -1;
  }
  if ((elementType === 'string' && validators.validateString === validateString) ||
    (elementType === 'boolean' && validators.validateBoolean === validateBoolean)) {
    for (let i = 0; i < length; i++) {
      if (typeof value[i] !== elementType) {
        return i;
      }
    }
    return -1;
  }
  return 0;
}
export {firstBadIndex};
