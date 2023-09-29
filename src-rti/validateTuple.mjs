import {assertType} from "./assertType.mjs";
/**
 * @param {*} value 
 * @param {*} expect 
 * @param {*} loc 
 * @param {*} name 
 * @param {*} critical 
 * @returns {boolean}
 */
function validateTuple(value, expect, loc, name, critical) {
  if (!value) {
    return false;
  }
  if (!(value instanceof Array)) {
    return false;
  }
  const { elements } = expect;
  return elements.every((element, i) => {
    return assertType(
      value[i],
      element,
      loc,
      `${name}[${i}]`,
      critical
    );
  });
}
export {validateTuple};
