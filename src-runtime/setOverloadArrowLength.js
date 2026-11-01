/**
 * Restores the declared length of an overloaded arrow's argument-capturing
 * wrapper. The function retains its existing inferred name and arrow behavior.
 * @template {Function} T
 * @param {T} fn - Instrumented arrow.
 * @param {number} length - Original number of leading required parameters.
 * @returns {T} The same function with its length restored.
 * @example
 * const fn = (...args) => args;
 * setOverloadArrowLength(fn, 1).length; // 1
 */
function setOverloadArrowLength(fn, length) {
  Object.defineProperty(fn, 'length', {value: length, configurable: true});
  return fn;
}
export {setOverloadArrowLength};
