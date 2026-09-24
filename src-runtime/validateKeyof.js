import {getTypeKeys} from "./getTypeKeys.js";
import {typedefs} from "./registerTypedef.js";
import {createTypeFromMapping} from "./createTypeFromMapping.js";
/**
 * @typedef {object} Keyof
 * @property {'keyof'} iterable - The type.
 * @property {import('./validateType.js').Type} argument - The argument.
 */
/**
 * @param {*} value - The actual value that we need to validate.
 * @param {*} expect - The supposed type information of said value.
 * @param {string} loc - String like `BoundingBox#compute`
 * @param {string} name - Name of the argument
 * @param {boolean} critical - Only `false` for unions.
 * @param {console["warn"]} warn - Function to warn with.
 * @param {number} depth - The depth to detect recursion.
 * @returns {boolean} Boolean indicating if a type is correct.
 */
function validateKeyof(value, expect, loc, name, critical, warn, depth) {
  let {argument} = expect;
  if (typeof argument === 'string' && typedefs[argument]) {
    argument = typedefs[argument];
  }
  if (argument && argument.type === 'mapping') {
    // Materialize mapped types (e.g. ComponentMap) before reading keys.
    // A directly self-referential mapping terminates via the missing-keys
    // fallback instead of looping: materialization needs strictly smaller types.
    const materialized = createTypeFromMapping(argument, warn);
    if (!materialized) {
      return false;
    }
    argument = materialized;
  }
  const keys = getTypeKeys(argument, warn);
  if (!keys) {
    return false;
  }
  const ret = keys.includes(value);
  if (!ret) {
    warn(`Key '${value}' isn't in keys.`, {value, keys});
  }
  return ret;
}
export {validateKeyof};
