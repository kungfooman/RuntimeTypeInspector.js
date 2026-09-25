/**
 * Runs residual-nested-demo.mjs through the real RTI transpiler and executes
 * the result, printing every type error RTI reports. Compare with:
 *   npx tsc --noEmit --allowJs --checkJs --strict residual-nested-demo.mjs
 * which is clean.
 */
import {readFileSync, writeFileSync} from 'fs';
import {parse} from '@babel/parser';
import {Asserter} from './src-transpiler/Asserter.js';
import {expandType} from './src-transpiler/expandType.js';
import {parserOptions} from './src-transpiler/parserOptions.js';

// Capture what inspectType posts on failure (plus the options counter).
const captured = [];
globalThis.self = {
  addEventListener: () => {},
  postMessage: (msg) => captured.push(msg),
};

const src = readFileSync('./residual-nested-demo.mjs', 'utf8');
const asserter = new Asserter({expandType, filename: 'residual-nested-demo.mjs'});
const out = (asserter.getHeader() + asserter.toSource(parse(src, parserOptions)))
  // Execute the working tree (ESM source) instead of the published CJS bundle.
  .replaceAll("'@runtime-type-inspector/runtime'", "'./src-runtime/index.js'");
writeFileSync('./residual-nested-demo.rti.mjs', out);

await import('./residual-nested-demo.rti.mjs');
const {options} = await import('./src-runtime/index.js');

console.log(`RTI reported ${captured.length} type error(s) (options.count=${options.count}):`);
for (const msg of captured) {
  console.log(`- ${msg.loc} > ${msg.name}: ${(msg.strings ?? []).join(' | ')}`);
}
if (captured.length === 0) {
  console.log('(no errors: RTI agrees with TS here)');
}
