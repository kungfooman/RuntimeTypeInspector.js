function importFile(content) {
  return "data:text/javascript;base64," + btoa(content);
}
const imports = {
  //"@babel/core": "./babel-core.mjs",
  "@babel/parser": "./babel-parser.mjs",
  //"@babel/helper-plugin-utils": "./babel-helper-plugin-utils.mjs",
  //"@babel/plugin-syntax-typescript": "./babel-plugin-syntax-typescript.mjs",
  "fs": importFile("export default {};"),
  "typescript": importFile("export default ts;"), // UMD import
  /*
  "path": importFile("export default {};"),
  "stream/web": importFile("export default {};"),
  "sharp": importFile("export default {};"),
  "onnxruntime-node": importFile("export default {};"),
  "onnxruntime-web": importFile(`
    //await import("https://cdnjs.cloudflare.com/ajax/libs/onnxruntime-web/1.15.0/ort.es6.min.js");
    await import("https://cdnjs.cloudflare.com/ajax/libs/onnxruntime-web/1.14.0/ort.es6.min.js");
    //http://127.0.0.1/transformer/onnxruntime/js/common/dist/
    //await import("http://127.0.0.1/transformer/onnxruntime/js/common/dist/ort-common.js");
    //await import("http://127.0.0.1/transformer/onnxruntime/js/web/dist/ort-webgl.js");
    //await import("https://cdnjs.cloudflare.com/ajax/libs/onnxruntime-web/1.14.0/ort.es6.min.js");
    let ONNX = globalThis.ort;
    export default ONNX;
    export {
      ONNX
    };
  `),
  */
};
const importmap = document.createElement("script");
importmap.type = "importmap";
importmap.textContent = JSON.stringify({imports});
const parent = document.body || document.head;
if (!parent) {
  throw "neither <body> nor <head> available to append importmap";
}
parent.append(importmap);
