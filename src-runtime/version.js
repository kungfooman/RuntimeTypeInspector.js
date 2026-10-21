/**
 * Build meta info: one plain object, rewritten by `node sync-version.js`
 * (which `npm run build` runs first). No placeholders, no environment
 * sniffing — importable everywhere the runtime runs: browsers, workers,
 * iframes, REPL, node tests, and foreign bundles that vendor RTI source
 * with their own pipeline.
 */
const RTI_INFO = {
  "version": "6.0.0",
  "commit": "1c4e20a723c51b0a7054056243f86edb747e776b",
  "subject": "Surface skip counts on the Stats button, rides split from suppressions"
};
export {RTI_INFO};
