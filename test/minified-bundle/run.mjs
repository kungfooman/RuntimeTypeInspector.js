/**
 * Minified-bundle litmus: builds the fixtures with real Rollup (plain and
 * terser-minified with `toplevel` mangling), runs each bundle as its own
 * `node` process against the files on disk in `out/`, and requires the
 * same verdict from each: exactly the two intentional negatives, keyed by
 * their dedup key. A name-based check passes the plain bundle but fails the
 * minified one (or vice versa); an identity-first check agrees on both.
 *
 *   node test/minified-bundle/run.mjs
 */
import {exit} from 'node:process';
import {buildBundles} from './build.mjs';
import {runBundle} from './runBundle.mjs';
// Both intentional negatives, nothing else: `lengthSquared(42)` rejects a
// number for `Vec`; `boot(world, {x, y})` rejects a plain object at the
// `boot` call boundary and again inside `World.prototype.setGravity`
// (RTI checks every annotated boundary it crosses, in both bundles).
const expectedKeys = new Set(['World.prototype.setGravity-gravity', 'boot-gravity', 'lengthSquared-v']);
/**
 * Summarizes captured errors by their dedup key.
 * @param {object[]} captured - Captured `postMessage` error objects.
 * @returns {Map<string, object>} Errors keyed by dedup key.
 */
function byKey(captured) {
  const map = new Map();
  for (const msg of captured) {
    if (msg?.action === 'addError') {
      map.set(msg.key, msg);
    }
  }
  return map;
}
const failures = [];
try {
  const {plain, min} = await buildBundles();
  console.log(`minified-bundle: built\n  plain: ${plain}\n  min:   ${min}`);
  const plainErrors = byKey(runBundle(plain, 0));
  const minErrors = byKey(runBundle(min, 1));
  const plainKeys = [...plainErrors.keys()].sort();
  const minKeys = [...minErrors.keys()].sort();
  const same = plainKeys.length === minKeys.length &&
    plainKeys.every((key, i) => key === minKeys[i]);
  if (!same) {
    failures.push(`plain vs minified disagree:\n  plain: ${plainKeys.join(', ')}\n  min:   ${minKeys.join(', ')}`);
  }
  const missing = [...expectedKeys].filter((key) => !minErrors.has(key));
  const extra = minKeys.filter((key) => !expectedKeys.has(key));
  if (missing.length > 0) {
    failures.push(`minified bundle missed intentional negatives: ${missing.join(', ')}`);
  }
  if (extra.length > 0) {
    failures.push(`minified bundle reported unexpected errors: ${extra.join(', ')}`);
  }
  if (failures.length === 0) {
    console.log(`minified-bundle: OK (plain and minified both report exactly: ${minKeys.join(', ')})`);
  }
} catch (/** @type {any} */ e) {
  failures.push(`harness threw: ${e?.stack ?? e}`);
}
for (const failure of failures) {
  console.error(`minified-bundle: ${failure}`);
}
exit(failures.length > 0 ? 1 : 0);
