/**
 * Matches tsc's `IArguments`: an indexed collection with an integer
 * `length`, a `callee`, and an iterator — not just anything iterable.
 * Arrays and generators fail upstream (no `callee`), while a real
 * `arguments` object and a foreign equivalent pass. `typeof` (not
 * `instanceof Function`) keeps the iterator check realm-safe: every
 * realm has its own `Function` constructor.
 * @param {*} value - The actual value that we need to validate.
 * @param {string} _expect - Unused: `IArguments` has no parameters.
 * @param {string} loc - String like `BoundingBox#compute`
 * @param {string} name - Name of the argument
 * @param {boolean} critical - Only `false` for unions.
 * @param {console["warn"]} warn - Function to warn with.
 * @param {number} depth - The depth to detect recursion.
 * @returns {boolean} True if value is an arguments-like object.
 */
function validateIArguments(value, _expect, loc, name, critical, warn, depth) {
  // Nullish values fail instead of throwing on the property reads below.
  // Each read is guarded: strict-mode `arguments` objects throw TypeError
  // on `.callee`, revoked proxies throw on any read.
  if (value === null || value === undefined) {
    warn('Expected IArguments, got nullish value.', {value});
    return false;
  }
  let iterator;
  let length;
  try {
    iterator = value[Symbol.iterator];
    length = value.length;
  } catch {
    warn('Expected IArguments with readable iterator and length.', {value});
    return false;
  }
  if (typeof iterator !== 'function') {
    warn('Expected IArguments with an iterator.', {value});
    return false;
  }
  if (typeof length !== 'number' || !Number.isInteger(length) || length < 0) {
    warn('Expected IArguments with an integer length.', {value});
    return false;
  }
  // A throwing `.callee` after a good iterator and length means
  // strict-mode `arguments` (callee access itself throws there): genuine,
  // so accept. A readable non-function `callee` (arrays, generators)
  // still fails.
  let callee;
  try {
    callee = value.callee;
  } catch {
    return true;
  }
  if (typeof callee !== 'function') {
    warn('Expected IArguments with a callee.', {value});
    return false;
  }
  return true;
}
export {validateIArguments};
