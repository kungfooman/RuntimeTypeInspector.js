import {recurse} from "./validators.js";
import {validators} from "./validators.js";
/**
 * Holes-tolerant container validation for proven over-allocation: like
 * `validateArray` for `{type: 'array', ...}` and like the `ArrayLike`
 * branch of `validateReference` for `{type: 'reference', ...}`, except
 * absent indices are skipped. Present values validate strictly —
 * wrong types, explicit `undefined` and `NaN` still fail. Each container
 * shape keeps its own container rule (`Array<T>` needs a real array,
 * `ArrayLike<T>` accepts any length-carrier); strings have no holes, so
 * the `in` test is skipped for them (it would throw on primitives).
 * Anything else fails closed with `unchecked`.
 * @param {*} value - The actual value that we need to validate.
 * @param {*} expect - The container expect (`array` or `ArrayLike` node).
 * @param {string} loc - String like `BoundingBox#compute`
 * @param {string} name - Name of the argument
 * @param {boolean} critical - Only `false` for unions.
 * @param {console["warn"]} warn - Function to warn with.
 * @param {number} depth - The depth to detect recursion.
 * @returns {boolean} Boolean indicating if a type is correct.
 */
function validateArrayLikeSparse(value, expect, loc, name, critical, warn, depth) {
  const isArray = expect && expect.type === 'array';
  const isArrayLike = expect && expect.type === 'reference' && expect.name === 'ArrayLike';
  if (!isArray && !isArrayLike) {
    warn('unchecked', {value, type: 'sparse', loc, name, expect});
    return false;
  }
  // Bare `ArrayLike` (no args) is a shape-only check like in
  // `validateReference`; a missing element type anywhere else is malformed
  // and fails closed.
  const elementType = isArray ? expect.elementType : (expect.args?.[0] ?? 'any');
  if (elementType === undefined) {
    warn('unchecked', {value, type: 'sparse', loc, name, expect});
    return false;
  }
  if (isArray && !(value instanceof Array)) {
    warn('Given `value` isn\'t an array.');
    return false;
  }
  if (!isArray) {
    if (value === null || value === undefined) {
      warn(`Expected ArrayLike, got ${value}.`, {value, expect: elementType});
      return false;
    }
    const valueType = typeof value;
    if (valueType !== 'object' && valueType !== 'function' && valueType !== 'string') {
      warn('Expected ArrayLike (object with numeric length).', {value});
      return false;
    }
  }
  const {length} = value;
  if (typeof length !== 'number' || !Number.isInteger(length) || length < 0) {
    warn('Expected ArrayLike to have an integer length >= 0.', {value});
    return false;
  }
  // Only real containers are probed for absence: strings have no holes,
  // and the `in` operator throws on primitives.
  const checkAbsent = typeof value !== 'string';
  for (let i = 0; i < length; i++) {
    if (checkAbsent && !(i in value)) {
      continue;
    }
    const valueIndex = value[i];
    const nameIndex = `${name}[${i}]`;
    const ret = recurse(valueIndex, elementType, loc, nameIndex, critical, warn, depth + 1);
    if (!ret) {
      const info = {expect: elementType, value: valueIndex};
      warn(`Element at index ${i} has a wrong type.`, info);
      return false;
    }
  }
  return true;
}
// Self-registered like the other runtime helpers: readable and overridable
// through `validators` without a release.
validators.validateArrayLikeSparse = validateArrayLikeSparse;
export {validateArrayLikeSparse};
