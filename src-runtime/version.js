/**
 * Build meta info: one plain object, rewritten by `node sync-version.js`
 * (which `npm run build` runs first). No placeholders, no environment
 * sniffing — importable everywhere the runtime runs: browsers, workers,
 * iframes, REPL, node tests, and foreign bundles that vendor RTI source
 * with their own pipeline.
 */
const RTI_INFO = {
  "version": "6.0.0",
  "commit": "470dd57f679d32240cf4a38589665163dc02c03f",
  "subject": "Homomorphic `Partial`/`Required` over indexed access, primitives, classes and friends (#302)"
};
export {RTI_INFO};
