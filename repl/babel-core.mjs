// Instead of loading this as UMD module, we will soon integrate Babel 8, which
// finally ships as proper ESM modules. But it requires a bit more work (tm).
await import("../unpkg.com_@babel_standalone@7.22.17_babel.js");
const {parseSync} = Babel._babel;
export {parseSync};
