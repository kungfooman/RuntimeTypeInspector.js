/**
 * Build meta info: one plain object, rewritten by `node sync-version.js`
 * (which `npm run build` runs first). No placeholders, no environment
 * sniffing — importable everywhere the runtime runs: browsers, workers,
 * iframes, REPL, node tests, and foreign bundles that vendor RTI source
 * with their own pipeline.
 */
const RTI_INFO = {
  "version": "6.0.0",
  "commit": "1d55964a537ee8167bd650748012ace29fb9641a",
  "subject": "re-track src-runtime/version.js"
};
export {RTI_INFO};
