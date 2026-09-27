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
import {basename, dirname, join, resolve} from 'path';
import {checkWithRti} from './test/parity/rtiCheck.mjs';

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
const captured = await checkWithRti(absIn, {keepFile: emit});
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
