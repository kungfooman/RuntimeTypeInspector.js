/**
 * Shared core behind `run-jsdoc.js` and the tsc/RTI parity harness: transpile
 * a JSDoc-annotated file with the RTI transpiler (same pipeline as
 * `test.js`), execute it against the working-tree runtime, and return every
 * reported type error.
 */
import {existsSync, readFileSync, rmSync, writeFileSync} from 'fs';
import {basename, dirname, extname, join, relative, resolve} from 'path';
import {fileURLToPath, pathToFileURL} from 'url';
import {randomUUID} from 'crypto';
import {parse} from '@babel/parser';
import {Asserter} from '../../src-transpiler/Asserter.js';
import {expandType} from '../../src-transpiler/expandType.js';
import {parserOptions} from '../../src-transpiler/parserOptions.js';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
/**
 * Checks whether a local dependency is an ESM source file. CommonJS `.js`
 * modules stay untouched because rewriting them as ESM changes their meaning.
 * @param {string} path - Absolute dependency path.
 * @returns {boolean} Whether the dependency can be transpiled as ESM.
 */
function isLocalESModule(path) {
  const extension = extname(path);
  if (extension === '.mjs') return true;
  if (extension !== '.js') return false;
  let directory = dirname(path);
  while (true) {
    const manifest = join(directory, 'package.json');
    if (existsSync(manifest)) {
      const content = JSON.parse(readFileSync(manifest, 'utf8'));
      return content.type === 'module';
    }
    const parent = dirname(directory);
    if (parent === directory) return false;
    directory = parent;
  }
}
/**
 * Transpiles local ESM dependencies alongside the entry point. Each run uses
 * unique dependency filenames so imported modules are evaluated afresh and
 * never overwrite an existing file.
 * @param {string} input - Absolute input path.
 * @param {string} output - Absolute generated path.
 * @param {Map<string, string>} generated - Input to generated path mapping.
 * @param {Set<string>} written - Generated files successfully written.
 * @param {string} runId - Unique suffix for generated dependencies.
 */
function transpileModule(input, output, generated, written, runId) {
  if (generated.has(input)) return;
  generated.set(input, output);
  const asserter = new Asserter({expandType, filename: basename(input)});
  const ast = parse(readFileSync(input, 'utf8'), parserOptions);
  for (const statement of ast.program.body) {
    if (statement.type !== 'ImportDeclaration' && statement.type !== 'ExportNamedDeclaration' &&
        statement.type !== 'ExportAllDeclaration') continue;
    const source = statement.source;
    if (!source || !source.value.startsWith('.')) continue;
    const dependency = resolve(dirname(input), source.value);
    if (!existsSync(dependency) || !isLocalESModule(dependency)) continue;
    let dependencyOut = generated.get(dependency);
    if (!dependencyOut) {
      const dependencyBase = basename(dependency, extname(dependency));
      dependencyOut = join(dirname(dependency), `${dependencyBase}.rti-${runId}.mjs`);
      if (existsSync(dependencyOut)) throw new Error(`Generated module already exists: ${dependencyOut}`);
      transpileModule(dependency, dependencyOut, generated, written, runId);
    }
    let specifier = relative(dirname(output), dependencyOut).replace(/\\/gu, '/');
    if (!specifier.startsWith('.')) specifier = `./${specifier}`;
    specifier += `?run=${runId}`;
    source.value = specifier;
    source.extra = {raw: JSON.stringify(specifier), rawValue: specifier};
  }
  const body = asserter.toSource(ast);
  let out = asserter.getHeader(ast) + body;
  const runtimeAbs = join(repoRoot, 'src-runtime', 'index.js');
  if (existsSync(runtimeAbs)) {
    let rel = relative(dirname(output), runtimeAbs).replace(/\\/gu, '/');
    if (!rel.startsWith('.')) rel = `./${rel}`;
    out = out.replaceAll("'@runtime-type-inspector/runtime'", `'${rel}'`);
  }
  writeFileSync(output, out);
  written.add(output);
}
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
  const generated = new Map();
  const written = new Set();
  const runId = randomUUID();
  try {
    transpileModule(absIn, absOut, generated, written, runId);
    await import(`${pathToFileURL(absOut).href}?run=${runId}`);
  } finally {
    if (!opts.keepFile) {
      for (const output of written) rmSync(output, {force: true});
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
