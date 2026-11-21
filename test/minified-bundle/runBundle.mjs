/**
 * Executes one bundle in a FRESH Node child process and returns the RTI
 * errors it reports. The file on disk is the artifact under test: plain and
 * minified bundles run as separate invocations of `node <bundle>`, and the
 * only channel back is a results JSON file. Nothing is imported in-process.
 */
import {execFileSync} from 'node:child_process';
import {readFileSync, rmSync} from 'node:fs';
import {execPath} from 'node:process';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
/**
 * Runs a bundle in a fresh `node` process and reads back its error report.
 * @param {string} absPath - Absolute bundle path.
 * @param {number} index - Unique index so concurrent runs use distinct files.
 * @returns {object[]} Captured `postMessage` error objects.
 */
function runBundle(absPath, index = 0) {
  const resultPath = join(here, `out.results.${index}.json`);
  try {
    execFileSync(execPath, [join(here, 'run-bundle-child.mjs'), absPath, resultPath], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return JSON.parse(readFileSync(resultPath, 'utf8'));
  } finally {
    rmSync(resultPath, {
      force: true,
    });
  }
}
export {runBundle};
