import {recurse} from "./validators.js";
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
  const getEffective = (el) => {
    if (el && typeof el === 'object' && el.type === 'tupleMember') return el.elementType;
    return el;
  };
  const isOptional = (el) => !!(el && typeof el === 'object' && el.type === 'tupleMember' && el.optional);
  const isDotDot = (el) => !!(el && typeof el === 'object' && ((el.type === 'tupleMember' && el.dotDot) || el.type === 'rest'));
  // Expand rest elements: ...[1,2,3] -> 1,2,3 ; ...T[] -> variadic ; ...b: T[] -> variadic
  const expanded = [];
  let variadic = null;
  let variadicPos = -1;
  for (const el of elements) {
    let raw = el;
    // Named rest: ...b: number[]  (tupleMember with dotDot)
    if (el && typeof el === 'object' && el.type === 'tupleMember' && el.dotDot) {
      raw = { type: 'rest', annotation: el.elementType };
    }
    if (raw && typeof raw === 'object' && raw.type === 'rest') {
      const ann = raw.annotation;
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
    const minLength = before.filter((el) => !isOptional(el)).length + after.filter((el) => !isOptional(el)).length;
    if (value.length < minLength) {
      warn('Value and tuple elements have different lengths (variadic).');
      return false;
    }
    // Validate before part
    for (let i = 0; i < before.length; i++) {
      if (value[i] === undefined && isOptional(before[i])) continue;
      if (!recurse(value[i], getEffective(before[i]), loc, `${name}[${i}]`, critical, warn, depth + 1)) {
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
      if (value[idx] === undefined && isOptional(after[i])) continue;
      if (!recurse(value[idx], getEffective(after[i]), loc, `${name}[${idx}]`, critical, warn, depth + 1)) {
        warn('Tuple validation failed.');
        return false;
      }
    }
    return true;
  }
  // Optional trailing tuple members: e.g. [string, number?] -> length 1 or 2
  let required = expanded.length;
  while (required > 0 && isOptional(expanded[required - 1])) required--;
  if (value.length < required || value.length > expanded.length) {
    warn('Value and tuple elements have different lengths.');
    return false;
  }
  const ret = expanded.every((element, i) => {
    if (i >= value.length) return isOptional(element); // missing optional is ok
    return recurse(
      value[i],
      getEffective(element),
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
