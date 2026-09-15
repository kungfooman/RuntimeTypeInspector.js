import {validateType} from "./validateType.js";
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
function validateTuple(value, expect, loc, name, critical, warn, depth) {
  if (!(value instanceof Array)) {
    warn('Given value for tuple must be an array.');
    return false;
  }
  const {elements} = expect;
  // Expand rest elements: ...[1,2,3] -> 1,2,3 ; ...T[] -> variadic
  const expanded = [];
  let variadic = null;
  let variadicPos = -1;
  for (const el of elements) {
    if (el && typeof el === 'object' && el.type === 'rest') {
      const ann = el.annotation;
      if (ann && ann.type === 'tuple' && Array.isArray(ann.elements)) {
        expanded.push(...ann.elements);
      } else if (ann && ann.type === 'array') {
        if (variadic) {
          warn('Multiple variadic rest elements not supported');
          return false;
        }
        variadic = ann;
        variadicPos = expanded.length;
      } else if (ann) {
        expanded.push(ann);
      }
    } else {
      expanded.push(el);
    }
  }
  if (variadic) {
    // Variadic array rest must be last logical element for now; handle before/after split
    const before = expanded.slice(0, variadicPos);
    const after = expanded.slice(variadicPos);
    const minLength = before.length + after.length;
    if (value.length < minLength) {
      warn('Value and tuple elements have different lengths (variadic).');
      return false;
    }
    // Validate before part
    for (let i = 0; i < before.length; i++) {
      if (!validateType(value[i], before[i], loc, `${name}[${i}]`, critical, warn, depth + 1)) {
        warn('Tuple validation failed.');
        return false;
      }
    }
    // Validate middle variadic part
    const middleCount = value.length - before.length - after.length;
    for (let i = 0; i < middleCount; i++) {
      const idx = before.length + i;
      if (!validateType(value[idx], variadic.elementType, loc, `${name}[${idx}]`, critical, warn, depth + 1)) {
        warn('Tuple validation failed.');
        return false;
      }
    }
    // Validate after part
    for (let i = 0; i < after.length; i++) {
      const idx = before.length + middleCount + i;
      if (!validateType(value[idx], after[i], loc, `${name}[${idx}]`, critical, warn, depth + 1)) {
        warn('Tuple validation failed.');
        return false;
      }
    }
    return true;
  }
  if (value.length !== expanded.length) {
    warn('Value and tuple elements have different lengths.');
    return false;
  }
  const ret = expanded.every((element, i) => {
    return validateType(
      value[i],
      element,
      loc,
      `${name}[${i}]`,
      critical,
      warn,
      depth + 1
    );
  });
  if (!ret) {
    warn('Tuple validation failed.');
    return false;
  }
  return true;
}
export {validateTuple};
