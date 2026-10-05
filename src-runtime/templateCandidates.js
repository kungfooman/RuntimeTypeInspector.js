/**
 * Dispatch table breaking the resolveTemplateLiteralCandidates <->
 * resolveTemplateLiteralValues import cycle. Leaf module by design: it
 * imports nothing, so every edge points at it and Rollup reports no
 * circular dependencies.
 * `resolveTemplateLiteralCandidates.js` populates the table at module scope,
 * so importing it (or the package index, or the published bundle) guarantees
 * a full table. The table stays writable on purpose: overriding entries from
 * userland (e.g. candidate enumeration for a custom interpolation kind) takes
 * effect immediately, without forking RTI or waiting for a release.
 * Keys mirror the export names, so dispatch and recursion read plainly with
 * no invented vocabulary.
 * @type {Record<string, Function>}
 */
const templateCandidates = {};
/**
 * Recursion entry for candidate enumeration: same contract as
 * `resolveTemplateLiteralCandidates`, read from the table at call time so
 * overrides compose. Throws a helpful error when used without
 * `resolveTemplateLiteralCandidates.js` ever being imported.
 * @param {import('./validateType.js').Type} expect - The type to enumerate.
 * @param {console["warn"]} warn - Function to warn with.
 * @param {number} [depth] - The depth to detect recursion.
 * @returns {string[]|undefined} All possible strings or `undefined` if not enumerable.
 * @example
 * import './resolveTemplateLiteralCandidates.js';
 * recurseCandidates('"en"', console.warn); // ['en']
 */
function recurseCandidates(expect, warn, depth = 0) {
  const resolve = templateCandidates.resolveTemplateLiteralCandidates;
  if (!resolve) {
    throw new Error('templateCandidates.resolveTemplateLiteralCandidates is not registered: import resolveTemplateLiteralCandidates.js (or the runtime index) first.');
  }
  return resolve(expect, warn, depth);
}
export {templateCandidates, recurseCandidates};
