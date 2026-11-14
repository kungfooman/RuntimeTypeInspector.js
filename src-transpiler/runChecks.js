import {parse        } from '@babel/parser';
import {parserOptions} from './parserOptions.js';
import {Asserter     } from './Asserter.js';
import {expandType   } from './expandType.js';
import * as runtime from '../src-runtime/index.js';
/**
 * Transpiles `src` with the real pipeline (same as `test.js`), executes it
 * against the real validators, and runs `body` with the resulting scope.
 * Every failed check is observed two ways: the emitted
 * `youCanAddABreakpointHere()` records a hit per failure, and posted RTI
 * messages are captured for content assertions (e.g. no `unchecked`, which
 * means a template was never inferred). Both only live for the duration of `body`.
 * @param {string} src - Source code to transpile and run.
 * @param {string} expose - Comma-separated top-level bindings to return.
 * @param {Function} body - Receives `(scope, {hits, posted})`.
 * @returns {*} Whatever `body` returns.
 * @example
 * const probe = (scope) => typeof scope.exampleFn;
 * runChecks(srcWithNumberParam, 'exampleFn', probe);
 */
function runChecks(src, expose, body) {
  const asserter = new Asserter({
    expandType,
    addHeader: false,
    filename: 'test.js',
    input: src,
  });
  let out = asserter.toSource(parse(src, parserOptions));
  // `export` cannot run inside `new Function`: strip it. Export only affects
  // how the transpiler attaches JSDoc (already done above), never the checks.
  out = out.replace(/^export default /gm, '').replace(/^export /gm, '');
  const hits = [];
  const posted = [];
  const origSelf = globalThis.self;
  globalThis.self = {
    addEventListener: () => {},
    postMessage: (msg) => posted.push(msg),
  };
  try {
    const names = [
      'inspectType',
      'inspectTypeWithTemplates',
      'inspectOverloads',
      'overloadPropertyKey',
      'youCanAddABreakpointHere',
      'registerClass',
      'registerTypedef',
      'registerVariable',
      'registerImportNamespaceSpecifier',
      'inspectIndexedAccess',
      'validateDivision',
    ];
    // Must execute converted code to test real checking.
    const fn = new Function( // eslint-disable-line no-new-func
      ...names,
      `${out}\n;return {${expose}};`,
    );
    const recordHit = (...args) => {
      hits.push(args);
    };
    const values = [
      runtime.inspectType,
      runtime.inspectTypeWithTemplates,
      runtime.inspectOverloads,
      runtime.overloadPropertyKey,
      recordHit,
      runtime.registerClass,
      runtime.registerTypedef,
      runtime.registerVariable,
      runtime.registerImportNamespaceSpecifier,
      runtime.inspectIndexedAccess,
      runtime.validateDivision,
    ];
    const scope = fn(
      ...values,
    );
    return body(scope, {hits, posted});
  } finally {
    globalThis.self = origSelf;
  }
}
export {runChecks};
