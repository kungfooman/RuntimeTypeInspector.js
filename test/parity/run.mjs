/**
 * tsc/RTI parity harness: differential testing with `tsc` as the oracle.
 *
 *   node test/parity/run.mjs
 *
 * Fixture convention (`test/parity/cases/*.mjs`): every case is one plain
 * function named `caseNN` with JSDoc types, an empty body, and its calls on
 * their own lines. tsc errors group by the called name on the error line;
 * RTI errors group by `msg.loc` (the validated function name). Per case the
 * error COUNTS must agree — unless the call line carries a divergence
 * marker, e.g.:
 *
 *   case07(NaN); // parity-diverges: rti-stricter (NaN always rejected)
 *
 * Markers assert their direction, so a fixed gap fails loudly as a stale
 * baseline instead of silently passing. tsc errors that match no call line
 * (bad JSDoc names, syntax) fail as fixture-authoring errors, as do case
 * functions that are never called. Exits 1 on any mismatch.
 */
import {execFileSync} from 'child_process';
import {readdirSync, readFileSync} from 'fs';
import {basename, dirname, join} from 'path';
import {fileURLToPath} from 'url';
import {checkWithRti, resetRuntimeState, repoRoot} from './rtiCheck.mjs';

const casesDir = join(dirname(fileURLToPath(import.meta.url)), 'cases');
const CASE_DEF = /^function (case\d+)\s*\(/gmu;
const CASE_CALL = /(case\d+)\s*\(/u;
const DIVERGE = /parity-diverges:\s*(rti-stricter|rti-quieter)\s*(.*)$/u;
/**
 * @param {string} file - Fixture basename.
 * @returns {{lines: string[], defined: string[]}} Source lines and case ids.
 */
function readFixture(file) {
  const lines = readFileSync(join(casesDir, file), 'utf8').split('\n');
  const defined = [...readFileSync(join(casesDir, file), 'utf8').matchAll(CASE_DEF)].map((_) => _[1]);
  return {lines, defined};
}
/**
 * Runs tsc over all fixtures and groups error counts per (file, case).
 * @param {string[]} files - Fixture basenames.
 * @returns {{counts: Map<string, number>, failures: string[]}} Counts and authoring failures.
 */
function checkWithTsc(files) {
  const counts = new Map();
  const failures = [];
  let output = '';
  try {
    execFileSync('npx', ['tsc', '--noEmit', '--allowJs', '--checkJs', '--strict', '--target', 'es2020', '--pretty', 'false',
      '--typeRoots', join(repoRoot, 'test', 'parity', 'empty-typings'),
      ...files.map((_) => join(casesDir, _))], {encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']});
  } catch (/** @type {any} */ e) {
    output = (e.stdout ?? '') + (e.stderr ?? '');
    if (!/error TS/u.test(output)) {
      failures.push(`tsc itself failed:\n${output}`);
      return {counts, failures};
    }
  }
  const sources = new Map(files.map((file) => [join(casesDir, file), readFixture(file).lines]));
  for (const line of output.split('\n')) {
    const match = /^(.*)\((\d+),(\d+)\): error TS\d+:/u.exec(line);
    if (!match) {
      continue;
    }
    const [, path, lineNo] = match;
    const source = sources.get(path) ?? sources.get(join(casesDir, basename(path)));
    if (!source) {
      failures.push(`tsc error in unknown file: ${line}`);
      continue;
    }
    const call = CASE_CALL.exec(source[Number(lineNo) - 1] ?? '');
    if (!call) {
      failures.push(`tsc error matches no case call (fix the fixture): ${line}`);
      continue;
    }
    const key = `${basename(path)}:${call[1]}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return {counts, failures};
}
/**
 * Runs RTI over one fixture and groups error counts per case.
 * @param {string} file - Fixture basename.
 * @param {string[]} lines - Source lines (for divergence markers).
 * @returns {Promise<{counts: Map<string, number>, divergences: Map<string, string>, called: Set<string>}>} Per-case data.
 */
async function checkFileWithRti(file, lines) {
  const {options} = await import(pathToOptionsUrl());
  // tsc accepts Infinity as number: mirror it so the oracle stays comparable
  // (the check itself is unit-tested; NaN stays a documented divergence).
  options.checkInfinity = false;
  await resetRuntimeState();
  options.checkInfinity = false;
  const captured = await checkWithRti(join(casesDir, file));
  const counts = new Map();
  for (const msg of captured) {
    const key = `${file}:${msg.loc}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const divergences = new Map();
  const called = new Set();
  lines.forEach((text) => {
    // Definition lines (`function case01(`) match the call regex too.
    if (/^\s*function\s+case\d+/u.test(text)) {
      return;
    }
    const call = CASE_CALL.exec(text);
    if (!call) {
      return;
    }
    called.add(call[1]);
    const marker = DIVERGE.exec(text);
    if (marker) {
      divergences.set(`${file}:${call[1]}`, `${marker[1]}${marker[2] ? ` (${marker[2].trim()})` : ''}`);
    }
  });
  return {counts, divergences, called};
}
/**
 * @returns {string} File URL of the runtime options module.
 */
function pathToOptionsUrl() {
  return `file://${join(repoRoot, 'src-runtime', 'options.js')}`;
}
/**
 * @param {string} file - Fixture basename.
 * @param {string[]} defined - Case ids defined in the fixture.
 * @param {Set<string>} called - Case ids with at least one call line.
 * @param {Map<string, number>} tsc - tsc error counts per case.
 * @param {Map<string, number>} rti - RTI error counts per case.
 * @param {Map<string, string>} divergences - Divergence markers per case.
 * @returns {string[]} Result lines (FAIL entries start with it).
 */
function compareCases(file, defined, called, tsc, rti, divergences) {
  const rows = [];
  const known = new Set(defined);
  for (const key of rti.keys()) {
    if (!known.has(key.split(':')[1])) {
      rows.push(`FAIL ${key}: RTI error outside any case (name helpers caseNN or fix loc)`);
    }
  }
  for (const id of defined) {
    const key = `${file}:${id}`;
    if (!called.has(id)) {
      rows.push(`FAIL ${key}: case function never called (dead fixture)`);
      continue;
    }
    const t = tsc.get(key) ?? 0;
    const r = rti.get(key) ?? 0;
    const marker = divergences.get(key);
    if (!marker) {
      rows.push(`${t === r ? 'ok' : 'FAIL'} ${key}: tsc=${t} rti=${r}`);
    } else if (marker.startsWith('rti-stricter')) {
      rows.push(`${r > t ? 'ok' : 'FAIL'} ${key}: tsc=${t} rti=${r} [${marker}]`);
    } else {
      rows.push(`${r < t ? 'ok' : 'FAIL'} ${key}: tsc=${t} rti=${r} [${marker}]`);
    }
  }
  return rows;
}
const files = readdirSync(casesDir).filter((_) => _.endsWith('.mjs')).sort();
const {counts: tscCounts, failures} = checkWithTsc(files);
const rows = [...failures.map((_) => `FAIL ${_}`)];
for (const file of files) {
  const {lines, defined} = readFixture(file);
  const {counts, divergences, called} = await checkFileWithRti(file, lines);
  rows.push(...compareCases(file, defined, called, tscCounts, counts, divergences));
}
console.log(rows.join('\n'));
const fails = rows.filter((_) => _.startsWith('FAIL')).length;
console.log(`\nparity: ${rows.length - fails}/${rows.length} cases agree (tsc oracle)`);
process.exit(fails ? 1 : 0);
