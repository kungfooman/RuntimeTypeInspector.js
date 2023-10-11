// Test: const {parse} = await import("@babel/parser");
/** @type {Record<string, any>} */
const exports = {};
globalThis.exports = exports;
await import("../node_modules/@babel/parser/lib/index.js");
export const {parse, parseExpression, tokTypes} = exports;
export default exports;
