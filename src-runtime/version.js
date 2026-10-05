/**
 * Build meta info: one plain object, rewritten by `node sync-version.js`
 * (which `npm run build` runs first). No placeholders, no environment
 * sniffing — importable everywhere the runtime runs: browsers, workers,
 * iframes, REPL, node tests, and foreign bundles that vendor RTI source
 * with their own pipeline.
 */
const RTI_INFO = {
  "version": "5.0.7",
  "commit": "7aa5ccf2c56ecb6df7d8c5becd57568094bfcf9d",
  "subject": "Make every substitution consumer-overwritable"
};
export {RTI_INFO};
