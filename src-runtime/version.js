/**
 * Build meta info: one plain object, rewritten by `node sync-version.js`
 * (which `npm run build` runs first). No placeholders, no environment
 * sniffing — importable everywhere the runtime runs: browsers, workers,
 * iframes, REPL, node tests, and foreign bundles that vendor RTI source
 * with their own pipeline.
 */
const RTI_INFO = {
  "version": "6.0.0",
  "commit": "cc50fd575512d708730d5f1392b7d80a473084b9",
  "subject": "Fix `{array}` runtime crash (any-array hole) + cross-realm `{Array}` subclasses (#329)",
};
export {RTI_INFO};
