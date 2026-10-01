/**
 * Build meta info: one plain object, rewritten by `node sync-version.js`
 * (which `npm run build` runs first). No placeholders, no environment
 * sniffing — importable everywhere the runtime runs: browsers, workers,
 * iframes, REPL, node tests, and foreign bundles that vendor RTI source
 * with their own pipeline.
 */
const RTI_INFO = {
  "version": "5.0.6",
  "commit": "ddec872a4f01bd72de31833abf12a30293f1104c",
  "subject": "Improve resizing and Maximize button to windows (#274)"
};
export {RTI_INFO};
