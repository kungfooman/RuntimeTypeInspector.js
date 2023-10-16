// Test: await import("@babel/helper-plugin-utils")
/** @type {Record<string, any>} */
const exports = {};
globalThis.exports = exports;
await import("../node_modules/@babel/helper-plugin-utils/lib/index.js");
export const {declare, declarePreset} = exports;
export default exports;
