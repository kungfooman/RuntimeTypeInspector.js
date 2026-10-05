/**
 * Build meta info: one plain object, rewritten by `node sync-version.js`
 * (which `npm run build` runs first). No placeholders, no environment
 * sniffing — importable everywhere the runtime runs: browsers, workers,
 * iframes, REPL, node tests, and foreign bundles that vendor RTI source
 * with their own pipeline.
 */
const RTI_INFO = {
  "version": "5.0.7",
  "commit": "664012c14a41a33a2f3918f53a9b033f16cbf015",
  "subject": "Dedup transpiler header imports against the file's own runtime imports (#298)"
};
export {RTI_INFO};
