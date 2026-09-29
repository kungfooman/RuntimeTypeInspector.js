/**
 * Library version and bundle build stamps.
 *
 * `npm run build` injects the real values via `buildInfoPlugin` in
 * rollup.config.js (package.json version, UTC build date, git commit hash
 * and subject). Running from source — dev, REPL, unit tests — the
 * placeholders survive and everything falls back: version to the mirrored
 * constant below (guarded by `version.spec.js`), build info to `null`.
 */
const PKG_VERSION = '__RTI_PKG_VERSION__';
const BUILD_DATE = '__RTI_BUILD_DATE__';
const BUILD_COMMIT = '__RTI_BUILD_COMMIT__';
const BUILD_SUBJECT = '__RTI_BUILD_SUBJECT__';
/**
 * @param {string} value - A possibly placeholder value.
 * @returns {boolean} True when the build left the placeholder in place.
 */
function isPlaceholder(value) {
  return typeof value === 'string' && value.startsWith('__RTI_') && value.endsWith('__');
}
const RTI_VERSION = isPlaceholder(PKG_VERSION) ? '5.0.4' : PKG_VERSION;
const RTI_BUILD = isPlaceholder(BUILD_DATE) ? null : {
  date: BUILD_DATE,
  commit: isPlaceholder(BUILD_COMMIT) ? null : BUILD_COMMIT,
  subject: isPlaceholder(BUILD_SUBJECT) ? null : BUILD_SUBJECT,
};
export {RTI_VERSION, RTI_BUILD};
