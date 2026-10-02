/**
 * JSDoc expectation harness: run-and-compare for `test/typechecking`.
 *
 *   node test/jsdoc-expect/run.mjs
 *
 * Fixture convention: every `<stem>-input.mjs` may carry a sibling
 * `<stem>-errors.json` stating exactly what must throw:
 *
 *   { "throws": [{ "loc": "takeKey", "name": "key", "value": "nope" }] }
 *
 * Each entry is one reported type error in execution order (`loc` is the
 * validated function, `name` the parameter, `value` the offending
 * argument — the stable machine-readable fields of a report; message
 * prose is never asserted). `value` is optional per entry and compares by
 * canonical JSON, so repeated calls to one function stay distinguishable
 * by what they threw, not just by order. The actual error sequence must
 * equal the expected one exactly: a missing entry means a call wrongly
 * passed, an extra entry means a false positive. Fixtures without a
 * sibling json are skipped. Malformed json fails as a fixture-authoring
 * error. Exits 1 on any mismatch.
 */
import {existsSync, readFileSync, readdirSync} from 'fs';
import {dirname, join} from 'path';
import {fileURLToPath} from 'url';
import {checkWithRti, resetRuntimeState, repoRoot} from '../parity/rtiCheck.mjs';

const fixturesDir = join(repoRoot, 'test', 'typechecking');
/**
 * Renders a value deterministically for comparison: object keys sorted,
 * exotic values (undefined, functions, symbols, bigint, NaN) spelled out
 * so they can never collide with real JSON.
 * @param {*} value - Value to render.
 * @returns {string} Canonical form.
 */
function canonical(value) {
  if (value === undefined) {
    return 'undefined';
  }
  if (typeof value === 'function') {
    return `function ${value.name || 'anonymous'}`;
  }
  if (typeof value === 'symbol') {
    return value.toString();
  }
  if (typeof value === 'bigint') {
    return `${value}n`;
  }
  if (typeof value === 'number' && Number.isNaN(value)) {
    return 'NaN';
  }
  if (value !== null && typeof value === 'object') {
    if (Array.isArray(value)) {
      return `[${value.map(canonical).join(',')}]`;
    }
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}
/**
 * Loads and validates one sibling expectation file.
 * @param {string} file - Fixture basename (`*-input.mjs`).
 * @returns {{expected: object[]|null, failure: string|null}} Expectations or an authoring failure.
 */
function readExpectations(file) {
  const stem = file.replace(/-input\.mjs$/u, '');
  const abs = join(fixturesDir, `${stem}-errors.json`);
  if (!existsSync(abs)) {
    return {expected: null, failure: null};
  }
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(abs, 'utf8'));
  } catch (/** @type {any} */ e) {
    return {expected: null, failure: `FAIL ${file}: bad errors.json (${e.message})`};
  }
  if (!parsed || !Array.isArray(parsed.throws)) {
    return {expected: null, failure: `FAIL ${file}: errors.json needs a "throws" array`};
  }
  for (const [i, entry] of parsed.throws.entries()) {
    if (!entry || typeof entry.loc !== 'string' || typeof entry.name !== 'string') {
      return {expected: null, failure: `FAIL ${file}: throws[${i}] needs string "loc" and "name"`};
    }
  }
  return {expected: parsed.throws, failure: null};
}
/**
 * Compares one fixture's actual errors against its expectations.
 * @param {string} file - Fixture basename.
 * @param {object[]} expected - Expected `{loc, name[, value]}` sequence.
 * @param {object[]} actual - Captured error sequence.
 * @returns {string} Result line (`FAIL` prefix on mismatch).
 */
function compareErrors(file, expected, actual) {
  const want = expected.map(({loc, name}) => ({loc, name}));
  const got = actual.map(({loc, name}) => ({loc, name}));
  if (JSON.stringify(want) !== JSON.stringify(got)) {
    const lines = [`FAIL ${file}: expected ${want.length} throw(s), got ${got.length}`];
    const width = Math.max(want.length, got.length);
    for (let i = 0; i < width; i++) {
      const w = i < want.length ? JSON.stringify(want[i]) : '—';
      const g = i < got.length ? JSON.stringify(got[i]) : '—';
      if (w !== g) {
        lines.push(`  [${i}] expected ${w}, got ${g}`);
      }
    }
    return lines.join('\n');
  }
  const rows = [];
  expected.forEach((entry, i) => {
    if (entry && 'value' in entry && canonical(entry.value) !== canonical(actual[i].value)) {
      rows.push(`  [${i}] value mismatch for ${actual[i].loc} > ${actual[i].name}: expected ${canonical(entry.value)}, got ${canonical(actual[i].value)}`);
    }
  });
  if (!rows.length) {
    return `ok ${file}: ${got.length} throw(s) as expected`;
  }
  return [`FAIL ${file}: ${rows.length} value mismatch(s)`, ...rows].join('\n');
}
const files = readdirSync(fixturesDir).filter((_) => _.endsWith('-input.mjs')).sort();
const rows = [];
let checked = 0;
for (const file of files) {
  const {expected, failure} = readExpectations(file);
  if (failure) {
    rows.push(failure);
    continue;
  }
  if (!expected) {
    continue;
  }
  checked++;
  await resetRuntimeState();
  const captured = await checkWithRti(join(fixturesDir, file));
  rows.push(compareErrors(file, expected, captured));
}
console.log(rows.join('\n'));
const fails = rows.filter((_) => _.startsWith('FAIL')).length;
console.log(`\njsdoc-expect: ${rows.length - fails}/${rows.length} fixtures agree (${checked} with errors.json)`);
process.exit(fails ? 1 : 0);
