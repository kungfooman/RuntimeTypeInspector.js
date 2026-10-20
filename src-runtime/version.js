/**
 * Build meta info: one plain object, rewritten by `node sync-version.js`
 * (which `npm run build` runs first). No placeholders, no environment
 * sniffing — importable everywhere the runtime runs: browsers, workers,
 * iframes, REPL, node tests, and foreign bundles that vendor RTI source
 * with their own pipeline.
 */
const RTI_INFO = {
  "version": "6.0.0",
  "commit": "03d93421dfce3714ff7a57d76560b4384f486fda",
  "subject": "Per-parameter check stats rows keyed by loc plus argument name"
};
export {RTI_INFO};
