/**
 * JSDoc expectation harness: run-and-compare for `test/typechecking`.
 *
 *   node test/jsdoc-expect/run.mjs
 *
 * Fixture convention: every `<stem>-input.mjs` may carry a sibling
 * `<stem>-errors.json` stating exactly what must throw:
 *
 *   { "throws": [{ "loc": "takeKey", "name": "key" }, ...] }
 *
 * Each entry is one reported type error in execution order (`loc` is the
 * validated function, `name` the parameter — the stable machine-readable
 * fields of a report; message prose is never asserted). The actual error
 * sequence must equal the expected one exactly: a missing entry means a
 * call wrongly passed, an extra entry means a false positive. Fixtures
 * without a sibling json are skipped. Malformed json fails as a
 * fixture-authoring error. Exits 1 on any mismatch.
 */
import {existsSync, readFileSync, readdirSync} from 'fs';
import {dirname, join} from 'path';
import {fileURLToPath} from 'url';
import {checkWithRti, resetRuntimeState, repoRoot} from '../parity/rtiCheck.mjs';

const fixturesDir = join(repoRoot, 'test', 'typechecking');
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
 * @param {object[]} expected - Expected `{loc, name}` sequence.
 * @param {object[]} actual - Captured `{loc, name}` sequence.
 * @returns {string} Result line (`FAIL` prefix on mismatch).
 */
function compareErrors(file, expected, actual) {
  const want = expected.map(({loc, name}) => ({loc, name}));
  const got = actual.map(({loc, name}) => ({loc, name}));
  if (JSON.stringify(want) === JSON.stringify(got)) {
    return `ok ${file}: ${got.length} throw(s) as expected`;
  }
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
