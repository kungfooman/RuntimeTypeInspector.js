import {docReaderBoth} from './docReaderBoth.js';
/**
 * Runs the probe with `console.warn` captured: the verdict plus the
 * warn count and payloads. The caller's warn is always restored.
 * @param {string} comment - Bare JSDoc tag text.
 * @returns {{verdict: string, warnings: any[][]}} Verdict and captured warns.
 */
function bothFor(comment) {
  const warnings = [];
  const origWarn = console.warn;
  console.warn = (...args) => warnings.push(args);
  const verdict = docReaderBoth(comment);
  console.warn = origWarn;
  return {verdict, warnings};
}
// Agreement stays silent: a clean comment prints nothing and returns SAME.
function testAgreementStaysSilent() {
  const {verdict, warnings} = bothFor('@param {number} x');
  return verdict === 'SAME' && warnings.length === 0;
}
// Covered granularity stays silent: the merged container difference is
// documented, not drift.
function testCoveredStaysSilent() {
  const {verdict, warnings} = bothFor('@param {object} options @param {number} [options.maxRetries]');
  return verdict === 'COVERED' && warnings.length === 0;
}
// Real drift warns exactly once with the comment and both documents, so
// the devtools entry locates the case and shows both sides. A stray `*/`
// closes the TS wrapper early while depfree reads the raw text: a genuine
// reader divergence through real inputs.
function testDriftWarnsOnceWithBothSides() {
  const comment = '@param {number} x */ @param {string} y';
  const {verdict, warnings} = bothFor(comment);
  if (verdict !== 'DRIFT' || warnings.length !== 1) {
    return false;
  }
  const payload = warnings[0][1] ?? {};
  return (
    payload.comment === comment &&
    payload.depfree !== undefined &&
    payload.fromTs !== undefined
  );
}
export const tests = [testAgreementStaysSilent, testCoveredStaysSilent, testDriftWarnsOnceWithBothSides];
