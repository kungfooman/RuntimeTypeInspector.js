import {recurse            } from "./validators.js";
import {isArrayValue       } from "./isArrayValue.js";
import {tupleEffective     } from "./tupleEffective.js";
import {tupleOptional      } from "./tupleOptional.js";
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
  if (!isArrayValue(value)) {
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
    const beforeRequired = before.filter(
      (el) => !tupleOptional(el),
    ).length;
    const afterRequired = after.filter(
      (el) => !tupleOptional(el),
    ).length;
    const minLength = beforeRequired + afterRequired;
    if (value.length < minLength) {
      warn('Value and tuple elements have different lengths (variadic).');
      return false;
    }
    // Validate before part
    for (let i = 0; i < before.length; i++) {
      if (value[i] === undefined && tupleOptional(before[i])) {
        continue;
      }
      const leafType = tupleEffective(before[i]);
      const leafName = `${name}[${i}]`;
      const leafDepth = depth + 1;
      const leafOk = recurse(
        value[i],
        leafType,
        loc,
        leafName,
        critical,
        warn,
        leafDepth,
      );
      if (!leafOk) {
        warn('Tuple validation failed.');
        return false;
      }
    }
    // Validate middle variadic part
    const middleCount = value.length - before.length - after.length;
    for (let i = 0; i < middleCount; i++) {
      const idx = before.length + i;
      const middleName = `${name}[${idx}]`;
      const middleDepth = depth + 1;
      const middleOk = recurse(
        value[idx],
        variadic.elementType,
        loc,
        middleName,
        critical,
        warn,
        middleDepth,
      );
      if (!middleOk) {
        warn('Tuple validation failed.');
        return false;
      }
    }
    // Validate after part
    for (let i = 0; i < after.length; i++) {
      const idx = before.length + middleCount + i;
      if (value[idx] === undefined && tupleOptional(after[i])) {
        continue;
      }
      const leafType = tupleEffective(after[i]);
      const leafName = `${name}[${idx}]`;
      const leafDepth = depth + 1;
      const leafOk = recurse(
        value[idx],
        leafType,
        loc,
        leafName,
        critical,
        warn,
        leafDepth,
      );
      if (!leafOk) {
        warn('Tuple validation failed.');
        return false;
      }
    }
    return true;
  }
  // Optional trailing tuple members: e.g. [string, number?] -> length 1 or 2
  let required = expanded.length;
  while (required > 0 && tupleOptional(expanded[required - 1])) {
    required--;
  }
  if (value.length < required || value.length > expanded.length) {
    warn('Value and tuple elements have different lengths.');
    return false;
  }
  const ret = expanded.every((element, i) => {
    if (i >= value.length) {
      // missing optional is ok
      return tupleOptional(element);
    }
    if (value[i] === undefined && tupleOptional(element)) {
      return true;
    }
    return recurse(
      value[i],
      tupleEffective(element),
      loc,
      `${name}[${i}]`,
      critical,
      warn,
      depth + 1,
    );
  });
  if (!ret) {
    warn('Tuple validation failed.');
    return false;
  }
  return true;
}
export {validateTuple};
