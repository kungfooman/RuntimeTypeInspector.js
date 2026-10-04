/**
 * Dispatch table breaking the substituteType <-> substituteArray/Record/Descriptors/List import cycles.
 * Leaf module by design: it imports nothing, so every edge points at it
 * and Rollup reports no circular dependencies.
 * `substituteType.js` populates the table at module scope, so importing it
 * (or the package index, or the published bundle) guarantees a full table.
 * The table stays writable on purpose: overriding entries from userland
 * (e.g. traversal for a custom `type:` kind introduced alongside a custom
 * validator) takes effect immediately, without forking RTI or waiting for
 * a release.
 * Keys mirror the export names (`substitutes.substituteArray === substituteArray`),
 * so dispatch and recursion read plainly with no invented vocabulary.
 * @type {Record<string, Function>}
 */
const substitutes = {};
/**
 * Recursion entry for substituters: same contract as `substituteType`, read
 * from the table at call time so overrides compose. Throws a helpful
 * error when used without `substituteType.js` ever being imported.
 * @param {*} type - The type.
 * @param {*} search - The search.
 * @param {*} replace - The replace.
 * @param {console["warn"]} warn - Function to warn with.
 * @returns {any} Substituted copy, sharing every unchanged subtree.
 * @example
 * import './substituteType.js';
 * recurseSubstitute('K', 'K', '"a"', console.warn); // '"a"'
 */
function recurseSubstitute(type, search, replace, warn) {
  const substitute = substitutes.substituteType;
  if (!substitute) {
    throw new Error('substitutes.substituteType is not registered: import substituteType.js (or the runtime index) first.');
  }
  return substitute(type, search, replace, warn);
}
export {substitutes, recurseSubstitute};
