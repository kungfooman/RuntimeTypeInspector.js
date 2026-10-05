/**
 * Shared core behind `run-jsdoc.js` and the tsc/RTI parity harness: transpile
 * a JSDoc-annotated file with the RTI transpiler (same pipeline as
 * `test.js`), execute it against the working-tree runtime, and return every
 * reported type error.
 */
import {existsSync, readFileSync, rmSync, writeFileSync} from 'fs';
import {basename, dirname, join, relative} from 'path';
import {fileURLToPath, pathToFileURL} from 'url';
import {parse} from '@babel/parser';
import {Asserter} from '../../src-transpiler/Asserter.js';
import {expandType} from '../../src-transpiler/expandType.js';
import {parserOptions} from '../../src-transpiler/parserOptions.js';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
/**
 * Transpiles and executes a file, capturing RTI type errors.
 * @param {string} absIn - Absolute path to the input `.mjs` file.
 * @param {object} [opts] - Options.
 * @param {boolean} [opts.keepFile] - Keep the transpiled `<basename>.rti.mjs` next to the input.
 * @returns {Promise<object[]>} Captured `postMessage` error objects.
 */
async function checkWithRti(absIn, opts = {}) {
  // inspectType posts failures via postMessage: capture them instead of a UI.
  const captured = [];
  globalThis.self = {
    addEventListener: () => {},
    postMessage: (msg) => captured.push(msg),
  };
  // Observation needs every error in full: `once` dedups repeats to
  // key-only ticks, which would hide per-call values from the comparison.
  const {options} = await import('../../src-runtime/options.js');
  options.mode = 'spam';
  const base = basename(absIn).replace(/\.[^.]+$/u, '');
  const absOut = join(dirname(absIn), `${base}.rti.mjs`);
  const asserter = new Asserter({expandType, filename: basename(absIn)});
  const ast = parse(readFileSync(absIn, 'utf8'), parserOptions);
  let out = asserter.getHeader(ast) + asserter.toSource(ast);
  // Execute the working tree (ESM source) instead of the published bundle.
  const runtimeAbs = join(repoRoot, 'src-runtime', 'index.js');
  if (existsSync(runtimeAbs)) {
    let rel = relative(dirname(absOut), runtimeAbs).replace(/\\/gu, '/');
    if (!rel.startsWith('.')) {
      rel = `./${rel}`;
    }
    out = out.replaceAll("'@runtime-type-inspector/runtime'", `'${rel}'`);
  }
  writeFileSync(absOut, out);
  try {
    await import(`${pathToFileURL(absOut).href}?run=${Date.now()}`);
  } finally {
    if (!opts.keepFile) {
      rmSync(absOut, {force: true});
    }
  }
  return captured;
}
/**
 * Resets registry and counter state between fixture files so cases can't
 * leak typedefs/classes into each other in one process.
 */
async function resetRuntimeState() {
  // Some runtime modules require a message global at import time; provide
  // the inert stub `checkWithRti` replaces with its capture per fixture.
  globalThis.self ??= {addEventListener: () => {}, postMessage: () => {}};
  const {typedefs, typedefTemplates} = await import('../../src-runtime/registerTypedef.js');
  const {classes} = await import('../../src-runtime/registerClass.js');
  const {options} = await import('../../src-runtime/options.js');
  const {reportedKeys} = await import('../../src-runtime/reportedKeys.js');
  const {substitutedCache} = await import('../../src-runtime/substitutedFor.js');
  Object.keys(typedefs).forEach((_) => delete typedefs[_]);
  Object.keys(typedefTemplates).forEach((_) => delete typedefTemplates[_]);
  Object.keys(classes).forEach((_) => delete classes[_]);
  options.count = 0;
  reportedKeys.clear();
  // Same-spelled sites in different files may carry different shapes.
  substitutedCache.clear();
}
export {checkWithRti, resetRuntimeState, repoRoot};
