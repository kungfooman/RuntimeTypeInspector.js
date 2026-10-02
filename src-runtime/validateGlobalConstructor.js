import {validators} from "./validators.js";
/**
 * Probe: true when `value` is an instance of the globally-resolvable
 * constructor named by `expect` — platform constructors beyond the class
 * registry, in every environment (unlike the `window`-only lookup it
 * complements). Never warns: the caller owns diagnostics and keeps
 * falling through to narrower checks on mismatch.
 * @param {*} value - The actual value that we need to validate.
 * @param {*} expect - The supposed type information of said value.
 * @param {string} loc - String like `BoundingBox#compute`
 * @param {string} name - Name of the argument
 * @param {boolean} critical - Only `false` for unions.
 * @param {console["warn"]} warn - Function to warn with.
 * @param {number} depth - The depth to detect recursion.
 * @returns {boolean} True on an `instanceof` match, false otherwise.
 */
function validateGlobalConstructor(value, expect, loc, name, critical, warn, depth) {
  const type = typeof expect === 'string' ? expect : expect?.type;
  if (typeof type !== 'string') {
    return false;
  }
  const ctor = validators.lookupGlobalConstructor(type);
  if (typeof ctor !== 'function') {
    return false;
  }
  try {
    return value instanceof ctor;
  } catch {
    return false;
  }
}
export {validateGlobalConstructor};
