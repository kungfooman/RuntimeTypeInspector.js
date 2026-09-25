/**
 * Type-check a JSDoc-annotated file with RTI, the way `tsc` checks types:
 *
 *   node run-jsdoc.js [--emit] <file.mjs>
 *
 * Transpiles `<file>` with the RTI transpiler (same pipeline as `test.js`),
 * executes it against the working-tree runtime and prints every reported
 * type error to stdout (nothing is written, like `tsc --noEmit` — redirect
 * output yourself if you want it in a file). With `--emit`, the transpiled
 * source is additionally kept next to the input as `<basename>.rti.mjs`.
 * Exits 1 when errors were reported.
 */
import {existsSync, readFileSync, rmSync, writeFileSync} from 'fs';
import {basename, dirname, join, relative, resolve} from 'path';
import {fileURLToPath, pathToFileURL} from 'url';
import {parse} from '@babel/parser';
import {Asserter} from './src-transpiler/Asserter.js';
import {expandType} from './src-transpiler/expandType.js';
import {parserOptions} from './src-transpiler/parserOptions.js';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const emit = args.includes('--emit');
const input = args.find((arg) => !arg.startsWith('-'));
if (!input) {
  console.error('usage: node run-jsdoc.js [--emit] <file.mjs>');
  process.exit(2);
}
const absIn = resolve(input);
const base = basename(absIn).replace(/\.[^.]+$/u, '');
const absOut = join(dirname(absIn), `${base}.rti.mjs`);

// inspectType posts failures via postMessage: capture them instead of a UI.
const captured = [];
globalThis.self = {
  addEventListener: () => {},
  postMessage: (msg) => captured.push(msg),
};

const asserter = new Asserter({expandType, filename: basename(absIn)});
let out = asserter.getHeader() + asserter.toSource(parse(readFileSync(absIn, 'utf8'), parserOptions));
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
  if (!emit) {
    rmSync(absOut, {force: true});
  }
}
const {options} = await import(pathToFileURL(runtimeAbs).href);

for (const msg of captured) {
  console.log(`${absIn} ${msg.loc} > ${msg.name}: ${(msg.strings ?? []).join(' | ')}`);
}
console.log(`RTI checked ${base}: ${captured.length} type error(s)`);
if (emit) {
  console.log(`transpiled: ${absOut}`);
}
if (captured.length) {
  process.exitCode = 1;
}
