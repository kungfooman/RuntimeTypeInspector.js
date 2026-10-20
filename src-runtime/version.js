/**
 * Build meta info: one plain object, rewritten by `node sync-version.js`
 * (which `npm run build` runs first). No placeholders, no environment
 * sniffing — importable everywhere the runtime runs: browsers, workers,
 * iframes, REPL, node tests, and foreign bundles that vendor RTI source
 * with their own pipeline.
 */
const RTI_INFO = {
  "version": "6.0.0",
  "commit": "2ee61db3df98883b443ed69788c78ece7a2128d9",
  "subject": "Rework UI again (again)"
};
export {RTI_INFO};
