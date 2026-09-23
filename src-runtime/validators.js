/**
 * Dispatch table breaking the validateType <-> validateX import cycles.
 * Leaf module by design: it imports nothing, so every edge points at it
 * and Rollup reports no circular dependencies.
 * `validateType.js` populates the table at module scope, so importing it
 * (or the package index, or the published bundle) guarantees a full table.
 * The table stays writable on purpose: overriding entries from userland
 * (e.g. a custom `reference` validator) takes effect immediately, without
 * forking RTI or waiting for a release.
 * Apart from `validate` (the recursion entry, same contract as
 * `validateType`), `arrayLike` and `typedef` (helpers with their own
 * shapes), keys are the `expect.type` strings dispatched on in `validateType`.
 * @type {Record<string, Function>}
 */
const validators = {};
/**
 * Recursion entry for validators: same contract as `validateType`, read
 * from the table at call time so overrides compose. Throws a helpful
 * error when used without `validateType.js` ever being imported.
 * @param {*} value - The actual value which we need to check.
 * @param {*} expect - Expected type structure.
 * @param {string} loc - String like `BoundingBox#compute`
 * @param {string} name - Name of the argument.
 * @param {boolean} critical - Only false for unions.
 * @param {console["warn"]} warn - Function to warn with.
 * @param {number} depth - The depth to detect recursion.
 * @returns {boolean} Returns wether `value` is in the shape of `expect`.
 */
function recurse(value, expect, loc, name, critical, warn, depth) {
  const validate = validators.validate;
  if (!validate) {
    throw new Error('validators.validate is not registered: import validateType.js (or the runtime index) first.');
  }
  return validate(value, expect, loc, name, critical, warn, depth);
}
export {validators, recurse};
