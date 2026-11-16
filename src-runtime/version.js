/**
 * Build meta info: one plain object, rewritten by `node sync-version.js`
 * (which `npm run build` runs first). No placeholders, no environment
 * sniffing — importable everywhere the runtime runs: browsers, workers,
 * iframes, REPL, node tests, and foreign bundles that vendor RTI source
 * with their own pipeline.
 */
const RTI_INFO = {
  "version": "6.0.0",
  "commit": "91b59684495dbecaf46102cb01b4bb0ef5d03d60",
  "subject": "Static blocks, full node coverage (#324)"
};
export {RTI_INFO};
