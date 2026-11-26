import {calleeNameOf} from './calleeNameOf.js';
/**
 * Probe callees the transpiler emits into checked functions: compiler
 * metadata, never a user call. Wrapping their object-literal metadata
 * would mark compiler output as fresh and break the validators that
 * read it. The wrap runs before emission, so probe nodes do not exist
 * yet; the set still guards post-emission passes and direct callers.
 * @returns {Set<string>} Shared probe callee names.
 * @example
 * probeCallNames().has('inspectType'); // true
 * @example
 * probeCallNames().has('fetch'); // false: user calls still wrap
 */
const sharedProbeCalls = new Set([
  'inspectOverloads',
  'inspectType',
  'inspectTypeWithTemplates',
  'inspectIndexedAccess',
  'youCanAddABreakpointHere',
  'markFresh',
  'markFreshSpread',
  'overloadPropertyKey',
  'registerVariable',
  'registerTypedef',
  'registerClass',
  'registerImportNamespaceSpecifier',
  'validateDivision',
  'setProjectVersion',
]);
function probeCallNames() {
  return sharedProbeCalls;
}
/**
 * Reports whether a call node targets compiler metadata instead of user code.
 * @param {import('@babel/types').Node} node - Babel call node.
 * @returns {boolean} True when the callee names a probe call.
 * @example
 * isProbeCall({
 *   type: 'CallExpression',
 *   callee: {
 *     type: 'Identifier',
 *     name: 'inspectType',
 *   },
 * }); // true: compiler metadata never wraps
 * @example
 * isProbeCall({
 *   type: 'CallExpression',
 *   callee: {
 *     type: 'Identifier',
 *     name: 'fetch',
 *   },
 * }); // false: user calls still wrap
 */
function isProbeCall(node) {
  return probeCallNames().has(calleeNameOf(node));
}
export {isProbeCall, probeCallNames};
