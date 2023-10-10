// Test: await import("@babel/plugin-syntax-typescript")
/** @type {Record<string, any>} */
const exports = {};
globalThis.exports = exports;
await import("../node_modules/@babel/plugin-syntax-typescript/lib/index.js");
export const {declare, declarePreset} = exports;
export default exports;
