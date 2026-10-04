/**
 * Build meta info: one plain object, rewritten by `node sync-version.js`
 * (which `npm run build` runs first). No placeholders, no environment
 * sniffing — importable everywhere the runtime runs: browsers, workers,
 * iframes, REPL, node tests, and foreign bundles that vendor RTI source
 * with their own pipeline.
 */
const RTI_INFO = {
  "version": "5.0.7",
  "commit": "c1218222178582df07ce61806719453bea6db484",
  "subject": "Fix panel Diagnosis: mapped optionality, array/tuple pinpoints, `$type` snapshots (#291)"
};
export {RTI_INFO};
