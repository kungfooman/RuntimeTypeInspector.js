/**
 * Child entry: runs ONE bundle in a fresh Node process and writes every RTI
 * error it reports to a JSON file. Spawned by `runBundle.mjs`, never
 * imported: a separate OS process means no shared module registry, no
 * state reset hacks, and no `?run=` cache busters — the bundle runs
 * exactly like a shipped artifact would.
 *
 * Usage: node run-bundle-child.mjs <bundleAbsPath> <resultJsonPath>
 */
import {writeFileSync} from 'node:fs';
import {argv} from 'node:process';
import {pathToFileURL} from 'node:url';
const [bundlePath, resultPath] = argv.slice(2);
const captured = [];
globalThis.self = {
  addEventListener: () => {},
  postMessage: (msg) => captured.push(msg),
};
const {options} = await import('../../src-runtime/options.js');
options.mode = 'spam';
options.enabled = true;
await import(pathToFileURL(bundlePath).href);
/**
 * JSON replacer: error payloads must survive the process boundary, so
 * non-serializable values degrade to strings instead of throwing.
 * @param {string} _key - The key being serialized.
 * @param {*} value - The value being serialized.
 * @returns {*} A serializable value.
 */
function safe(_key, value) {
  if (typeof value === 'bigint') {
    return `${value}n`;
  }
  if (typeof value === 'function' || typeof value === 'symbol') {
    return String(value);
  }
  return value;
}
writeFileSync(resultPath, JSON.stringify(captured, safe));
