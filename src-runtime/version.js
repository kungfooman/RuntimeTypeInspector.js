/**
 * Build meta info: one plain object, rewritten by `node sync-version.js`
 * (which `npm run build` runs first). No placeholders, no environment
 * sniffing — importable everywhere the runtime runs: browsers, workers,
 * iframes, REPL, node tests, and foreign bundles that vendor RTI source
 * with their own pipeline.
 */
const RTI_INFO = {"version":"5.0.5","commit":"e8f904782afa84cb27cf7a8904a92f56b0e1bfeb","subject":"Fix display of Map/Set"};
export {RTI_INFO};
