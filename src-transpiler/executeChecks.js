import {parse} from '@babel/parser';
import {parserOptions} from './parserOptions.js';
import {Asserter} from './Asserter.js';
import {expandType} from './expandType.js';
import * as runtime from '../src-runtime/index.js';
/**
 * Transpiles `src` with the real pipeline (same as `test.js`), executes it
 * against the real validators, and runs `body` with the resulting scope.
 * Every failed check is observed two ways: the emitted
 * `youCanAddABreakpointHere()` records a hit per failure, and posted RTI
 * messages are captured for content assertions (e.g. no `unchecked`, the
 * symptom of issue #265). Both only live for the duration of `body`.
 * @param {string} src - Source code to transpile and run.
 * @param {string} expose - Comma-separated top-level bindings to return.
 * @param {Function} body - Receives `(scope, {hits, posted})`.
 * @returns {*} Whatever `body` returns.
 */
function runChecks(src, expose, body) {
  const asserter = new Asserter({expandType, addHeader: false, filename: 'test.js'});
  let out = asserter.toSource(parse(src, parserOptions));
  // `export` cannot run inside `new Function`: strip it. Export only affects
  // how the transpiler attaches JSDoc (already done above), never the checks.
  out = out.replace(/^export /gm, '');
  const hits = [];
  const posted = [];
  const origSelf = globalThis.self;
  globalThis.self = {addEventListener: () => {}, postMessage: (msg) => posted.push(msg)};
  try {
    // eslint-disable-next-line no-new-func -- must execute converted code to test real checking
    const fn = new Function(
      'inspectType', 'inspectTypeWithTemplates', 'youCanAddABreakpointHere',
      'registerClass', 'registerTypedef', 'registerVariable', 'registerImportNamespaceSpecifier',
      'inspectIndexedAccess', 'validateDivision',
      `${out}\n;return {${expose}};`
    );
    const scope = fn(
      runtime.inspectType, runtime.inspectTypeWithTemplates, (...args) => {
        hits.push(args);
      },
      runtime.registerClass, runtime.registerTypedef, runtime.registerVariable,
      runtime.registerImportNamespaceSpecifier, runtime.inspectIndexedAccess, runtime.validateDivision
    );
    return body(scope, {hits, posted});
  } finally {
    globalThis.self = origSelf;
  }
}
/**
 * Every posted message must name a real type: `unchecked` means a template
 * was never inferred (the exact #265 symptom).
 * @param {object[]} posted - Captured RTI messages.
 * @returns {boolean} True when no message degrades to `unchecked`.
 */
function noneUnchecked(posted) {
  return posted.every((msg) => !(msg.strings ?? []).join(' ').includes('unchecked'));
}
export {runChecks, noneUnchecked};
