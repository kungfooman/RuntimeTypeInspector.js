import {classes} from "./registerClass.js";
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
export function validateTypeof(value, expect, loc, name, critical, warn, depth) {
  // console.log("validateTypeof", {value, expect, loc, name, critical, warn, depth});
  return value === classes[expect.argument];
}
