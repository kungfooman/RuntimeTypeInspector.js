/**
 * Build meta info: one plain object, rewritten by `node sync-version.js`
 * (which `npm run build` runs first). No placeholders, no environment
 * sniffing — importable everywhere the runtime runs: browsers, workers,
 * iframes, REPL, node tests, and foreign bundles that vendor RTI source
 * with their own pipeline.
 */
const RTI_INFO = {
  "version": "5.0.7",
  "commit": "395fc29e247bfe3c0a93e60ebb2de64f311b5798",
  "subject": "UI update (#277)"
};
export {RTI_INFO};
