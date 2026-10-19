/**
 * Build meta info: one plain object, rewritten by `node sync-version.js`
 * (which `npm run build` runs first). No placeholders, no environment
 * sniffing — importable everywhere the runtime runs: browsers, workers,
 * iframes, REPL, node tests, and foreign bundles that vendor RTI source
 * with their own pipeline.
 */
const RTI_INFO = {
  "version": "6.0.0",
  "commit": "1d401082bb8e6e311cb9296b4b2afe439c3351d7",
  "subject": "Rework to only start windowing once it hit a 100ms cap"
};
export {RTI_INFO};
