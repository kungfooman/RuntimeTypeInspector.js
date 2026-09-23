import {typedefs} from "./registerTypedef.js";
import {classes} from "./registerClass.js";
import {validateType} from "./validateType.js";
import {validateArray} from "./validateArray.js";
import {validateArrayLike} from "./validateArrayLike.js";
/**
 * @param {*} value - The actual value that we need to validate.
 * @param {*} elementType - The element type each indexed entry must satisfy.
 * @param {string} loc - String like `BoundingBox#compute`
 * @param {string} name - Name of the argument
 * @param {boolean} critical - Only `false` for unions.
 * @param {console["warn"]} warn - Function to warn with.
 * @param {number} depth - The depth to detect recursion.
 * @returns {boolean} Boolean indicating if a type is correct.
 */
/**
 * @param {*} value - The actual value that we need to validate.
 * @param {import('./validateType.js').TypeObject} expect - The supposed type information of said value.
 * @param {string} loc - String like `BoundingBox#compute`
 * @param {string} name - Name of the argument
 * @param {boolean} critical - Only `false` for unions.
 * @param {console["warn"]} warn - Function to warn with.
 * @param {number} depth - The depth to detect recursion.
 * @returns {boolean} Boolean indicating if a type is correct.
 */
function validateReference(value, expect, loc, name, critical, warn, depth) {
  const {name: refName, args} = expect;
  const firstArg = args?.[0];
  switch (refName) {
    case 'ArrayLike':
    case 'NodeListOf':
    case 'HTMLCollectionOf':
    case 'NodeList':
    case 'HTMLCollection':
      // Bare `ArrayLike` / DOM list types without <T>: shape-only check.
      return validateArrayLike(value, firstArg ?? 'any', loc, name, critical, warn, depth + 1);
    case 'ReadonlyArray':
      // Readonly-ness is erased at runtime, same shape as Array.
      if (!firstArg) {
        warn('ReadonlyArray requires one type argument.', {expect});
        return false;
      }
      return validateArray(value, {type: 'array', elementType: firstArg}, loc, name, critical, warn, depth + 1);
    case 'ConcatArray':
      // ConcatArray<T> is array-like (length + indexed access) plus join/slice.
      // Accept anything array-like here; arrays trivially satisfy it.
      if (!firstArg) {
        warn('ConcatArray requires one type argument.', {expect});
        return false;
      }
      return validateArrayLike(value, firstArg, loc, name, critical, warn, depth + 1);
    case 'Readonly':
      // Readonly<T> doesn't change the runtime shape.
      if (!firstArg) {
        warn('Readonly requires one type argument.', {expect});
        return false;
      }
      return validateType(value, firstArg, loc, name, critical, warn, depth + 1);
    case 'NonNullable':
      if (!firstArg) {
        warn('NonNullable requires one type argument.', {expect});
        return false;
      }
      if (value === null || value === undefined) {
        warn('Expected NonNullable, got null/undefined.', {value});
        return false;
      }
      return validateType(value, firstArg, loc, name, critical, warn, depth + 1);
    case 'Iterable':
    case 'IterableIterator':
      if (value === null || value === undefined) {
        warn(`Expected ${refName}, got ${value}.`, {value});
        return false;
      }
      if (typeof value[Symbol.iterator] !== 'function') {
        warn(`Expected ${refName} with [Symbol.iterator].`, {value});
        return false;
      }
      if (firstArg && value instanceof Array) {
        return validateArrayLike(value, firstArg, loc, name, critical, warn, depth + 1);
      }
      return true;
    case 'AsyncIterable':
    case 'AsyncIterableIterator':
      if (value === null || value === undefined) {
        warn(`Expected ${refName}, got ${value}.`, {value});
        return false;
      }
      if (typeof value[Symbol.asyncIterator] !== 'function') {
        warn(`Expected ${refName} with [Symbol.asyncIterator].`, {value});
        return false;
      }
      return true;
  }
  if (typedefs[refName] && !classes[refName]) {
    if (args?.length) {
      warn(`Generic typedef '${refName}' with type arguments isn't supported yet, validating against raw typedef.`, {expect});
    }
    return validateType(value, typedefs[refName], loc, name, critical, warn, depth + 1);
  }
  if (classes[refName]) {
    return value instanceof classes[refName];
  }
  if (value && value.constructor && value.constructor.name === refName) {
    return true;
  }
  if (typeof globalThis !== 'undefined') {
    const globalClass = globalThis[refName];
    if (globalClass && value instanceof globalClass) {
      return true;
    }
  }
  warn('unchecked', {value, type: 'reference', loc, name, expect});
  return false;
}
export {validateReference};
