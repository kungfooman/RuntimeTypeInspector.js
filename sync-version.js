/**
 * Rewrites `src-runtime/version.js` with plain ESM literals: the version
 * from `package.json` (single source of truth — never hand-mirrored) plus
 * fresh build stamps. Runs first in `npm run build`, so every bundle logs
 * which version and commit it was built from. Never fails the build: git
 * info is best-effort (missing outside checkouts), and any failure only
 * warns, leaving the current literals in place.
 */
import {execSync} from 'child_process';
import {readFileSync, writeFileSync} from 'fs';
/**
 * Best-effort git one-liner (`null` outside checkouts).
 * @param {string} format - `--format` string.
 * @returns {string|null} Trimmed output or `null`.
 */
function gitLog(format) {
  try {
    return execSync(`git log -1 --format=${format}`, {encoding: 'utf8'}).trim() || null;
  } catch {
    return null;
  }
}
try {
  const {version} = JSON.parse(readFileSync('package.json', 'utf8'));
  // No date stamp: version + commit identify a build uniquely, while a
  // timestamp would make every build (and bundle) differ for no reason.
  const info = {
    version,
    commit: gitLog('%H'),
    subject: gitLog('%s'),
  };
  writeFileSync('src-runtime/version.js',
    '/**\n' +
    ' * Build meta info: one plain object, rewritten by `node sync-version.js`\n' +
    ' * (which `npm run build` runs first). No placeholders, no environment\n' +
    ' * sniffing — importable everywhere the runtime runs: browsers, workers,\n' +
    ' * iframes, REPL, node tests, and foreign bundles that vendor RTI source\n' +
    ' * with their own pipeline.\n' +
    ' */\n' +
    `const RTI_INFO = ${JSON.stringify(info)};\n` +
    'export {RTI_INFO};\n');
  console.log(`sync-version: RTI_INFO.version=${version} commit=${info.commit}`);
} catch (error) {
  console.warn('sync-version: leaving version.js untouched:', error?.message ?? error);
}
