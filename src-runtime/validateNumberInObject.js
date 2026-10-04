import {validateNumber} from "./validateNumber.js";
/**
 * Legacy obj/prop-style wrapper: validates `obj[prop]` as a proper number
 * and keeps the `type#prop` warning keys the old `validateNumber(obj, prop)`
 * generated. Delegates the actual check to `validateNumber`.
 * @param {Object<string|number, *>} obj - The object holding the property.
 * @param {string|number} prop - Name or index of property.
 * @param {console["warn"]} warn - Function to warn with.
 * @returns {boolean} True if `obj[prop]` is a proper number.
 * @example
 * validateNumberInObject({x: 1}, 'x', () => {}); // true
 */
function validateNumberInObject(obj, prop, warn = console.warn) {
  const value = obj?.[prop];
  const key = `${obj === null ? 'null' : typeof obj}#${String(prop)}`;
  const details = [];
  const collect = (...args) => details.push(...args);
  const ret = validateNumber(value, 'number', key, String(prop), true, collect, 0);
  if (!ret) {
    warn(key, {obj, prop, value}, ...details);
  }
  return ret;
}
export {validateNumberInObject};
