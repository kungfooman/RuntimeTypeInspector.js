import {recurse} from "./validators.js";
import {tupleEffective} from "./tupleEffective.js";
import {tupleOptional} from "./tupleOptional.js";
import {expandTupleElements} from "./expandTupleElements.js";
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
  const {expanded, variadic, variadicPos, error} = expandTupleElements(elements);
  if (error) {
    warn('Multiple variadic rest elements not supported');
    return false;
  }
  if (variadic) {
    // Variadic array rest must be last logical element for now; handle before/after split
    const before = expanded.slice(0, variadicPos);
    const after = expanded.slice(variadicPos);
    const minLength = before.filter((el) => !tupleOptional(el)).length + after.filter((el) => !tupleOptional(el)).length;
    if (value.length < minLength) {
      warn('Value and tuple elements have different lengths (variadic).');
      return false;
    }
    // Validate before part
    for (let i = 0; i < before.length; i++) {
      if (value[i] === undefined && tupleOptional(before[i])) continue;
      if (!recurse(value[i], tupleEffective(before[i]), loc, `${name}[${i}]`, critical, warn, depth + 1)) {
        warn('Tuple validation failed.');
        return false;
      }
    }
    // Validate middle variadic part
    const middleCount = value.length - before.length - after.length;
    for (let i = 0; i < middleCount; i++) {
      const idx = before.length + i;
      if (!recurse(value[idx], variadic.elementType, loc, `${name}[${idx}]`, critical, warn, depth + 1)) {
        warn('Tuple validation failed.');
        return false;
      }
    }
    // Validate after part
    for (let i = 0; i < after.length; i++) {
      const idx = before.length + middleCount + i;
      if (value[idx] === undefined && tupleOptional(after[i])) continue;
      if (!recurse(value[idx], tupleEffective(after[i]), loc, `${name}[${idx}]`, critical, warn, depth + 1)) {
        warn('Tuple validation failed.');
        return false;
      }
    }
    return true;
  }
  // Optional trailing tuple members: e.g. [string, number?] -> length 1 or 2
  let required = expanded.length;
  while (required > 0 && tupleOptional(expanded[required - 1])) required--;
  if (value.length < required || value.length > expanded.length) {
    warn('Value and tuple elements have different lengths.');
    return false;
  }
  const ret = expanded.every((element, i) => {
    if (i >= value.length) return tupleOptional(element); // missing optional is ok
    return recurse(
      value[i],
      tupleEffective(element),
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
