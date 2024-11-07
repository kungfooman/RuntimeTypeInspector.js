/**
 * @param {string} content - The content.
 * @returns {string} data:text string
 */
function importFile(content) {
  return "data:text/javascript;base64," + btoa(content);
}
const dir = location.origin + location.pathname.replace(/[a-z]+.html/, '');
const nodeModules = dir + 'node_modules/';
// For React ESM importmap to work you need React ESM: npm i react-es6
const react = {
  'prop-types'               : nodeModules + 'react-es6/prop-types/index.js',
  'tiny-warning'             : nodeModules + 'react-es6/tiny-warning.mjs',
  'tiny-invariant'           : nodeModules + 'react-es6/tiny-invariant.mjs',
  'mini-create-react-context': nodeModules + 'react-router/node_modules/mini-create-react-context/dist/esm/index.js',
  'path-to-regexp'           : nodeModules + 'react-es6/path-to-regexp.mjs',
  'react-is'                 : nodeModules + 'react-es6/react-is.mjs',
  'hoist-non-react-statics'  : nodeModules + 'react-es6/hoist-non-react-statics.mjs',
  'resolve-pathname'         : nodeModules + 'react-es6/resolve-pathname.mjs',
  'isarray'                  : nodeModules + 'react-es6/isarray.mjs',
};
const reactMin = {
  ...react,
  'react'           : nodeModules + 'react-es6/build/react.min.mjs',
  'react-dom'       : nodeModules + 'react-es6/build/react-dom.min.mjs',
  'react-dom/client': nodeModules + 'react-es6/build/react-dom-client.min.mjs',
};
const imports = {
  "@runtime-type-inspector/runtime"   : '../src-runtime/index.js',
  "@runtime-type-inspector/transpiler": '../src-transpiler/index.js',
  "@babel/parser"                     : nodeModules + '@babel/parser/lib/index.js',
  "display-anything"                  : nodeModules + 'display-anything/src/index.js',
  "worker-with-import-map"            : nodeModules + 'worker-with-import-map/src/index.js',
  "test-import-validation-b"          : '../test/typechecking/import-validation/b.js',
  //"@babel/helper-plugin-utils"      : './babel-helper-plugin-utils.js',
  //"@babel/plugin-syntax-typescript" : './babel-plugin-syntax-typescript.js',
  "fs"                                : importFile("export default {};"),
  "typescript"                        : importFile(`
    globalThis.module = {exports: {}};
    await import("${nodeModules}typescript/lib/typescript.js");
    export default globalThis.module.exports;
  `),
  "ace-builds": importFile(`
    await import("${nodeModules}ace-builds/src/ace.js");
    window.ace.config.set('basePath', "${nodeModules}ace-builds/src");
    const {ace} = window;
    export {ace};
  `),
  ...reactMin,
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
