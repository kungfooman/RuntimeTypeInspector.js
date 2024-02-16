/**
 * @param {string} content - The content.
 * @returns {string} data:text string
 */
function importFile(content) {
  return "data:text/javascript;base64," + btoa(content);
}
const imports = {
  "@runtime-type-inspector/runtime"   : '../src-runtime/index.js',
  "@runtime-type-inspector/transpiler": '../src-transpiler/index.mjs',
  "@babel/parser": "./babel-parser.mjs",
  "display-anything": "./node_modules/display-anything/src/index.js",
  "test-import-validation-b": "../test/typechecking/import-validation/b.js",
  //"@babel/helper-plugin-utils": "./babel-helper-plugin-utils.mjs",
  //"@babel/plugin-syntax-typescript": "./babel-plugin-syntax-typescript.mjs",
  "fs": importFile("export default {};"),
  "typescript": importFile("export default ts;"), // UMD import
};
if (location.host.includes('runtimetypeinspector.org') || location.port === '7000') {
  imports['@runtime-type-inspector/runtime'   ] = './node_modules/@runtime-type-inspector/runtime/index.mjs';
  imports['@runtime-type-inspector/transpiler'] = './node_modules/@runtime-type-inspector/transpiler/index.mjs';
}
const importmap = document.createElement("script");
importmap.type = "importmap";
importmap.textContent = JSON.stringify({imports});
const dom = document.body || document.head;
if (!dom) {
  throw new Error("neither <body> nor <head> available to append importmap");
}
dom.append(importmap);
