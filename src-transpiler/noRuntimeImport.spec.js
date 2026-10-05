import {readdirSync, readFileSync} from 'fs';
import {dirname, join} from 'path';
import {fileURLToPath} from 'url';
const dir = dirname(fileURLToPath(import.meta.url));
/**
 * Lists non-spec transpiler modules importing the runtime.
 * @returns {string[]} Offending file names.
 */
function runtimeImporters() {
  const offenders = [];
  for (const file of readdirSync(dir)) {
    if (!file.endsWith('.js') || file.endsWith('.spec.js') || file === 'runChecks.js') {
      continue;
    }
    if (readFileSync(join(dir, file), 'utf8').includes('src-runtime')) {
      offenders.push(file);
    }
  }
  return offenders;
}
function testNoTranspilerModuleImportsRuntime() {
  // The published transpiler must stay runtime-free: `runChecks` (the lone
  // spec-only exception below) executes snippets against real validators,
  // and its import once dragged the whole runtime into the bundle.
  return runtimeImporters().length === 0;
}
function testIndexDoesNotExportRunChecks() {
  // `runChecks` lives for specs via direct import; re-exporting it from the
  // index pulls the runtime into every consumer's transpiler bundle.
  return !readFileSync(join(dir, 'index.js'), 'utf8').includes('runChecks');
}
export const tests = [
  testNoTranspilerModuleImportsRuntime,
  testIndexDoesNotExportRunChecks,
];
