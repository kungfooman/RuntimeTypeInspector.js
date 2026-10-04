/**
 * Build meta info: one plain object, rewritten by `node sync-version.js`
 * (which `npm run build` runs first). No placeholders, no environment
 * sniffing — importable everywhere the runtime runs: browsers, workers,
 * iframes, REPL, node tests, and foreign bundles that vendor RTI source
 * with their own pipeline.
 */
const RTI_INFO = {
  "version": "5.0.7",
  "commit": "0a2318bfe1eb5dc3701eb457a546647ab34568a3",
  "subject": "Consumer sync script (#294)"
};
export {RTI_INFO};
