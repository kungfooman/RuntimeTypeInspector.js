
// Test: const {babelPluginSyntaxTypeScript} = await import("@babel/plugin-syntax-typescript");
/*
const {parse} = await import("@babel/parser");
parse('type tmp = 123;', {
  plugins: [babelPluginSyntaxTypeScript?]
})
*/
import {declare} from '@babel/helper-plugin-utils';
/**
 * @param {any[]} plugins 
 * @param {string} name 
 */
function removePlugin(plugins, name) {
  const indices = [];
  plugins.forEach((plugin, i) => {
    const n = Array.isArray(plugin) ? plugin[0] : plugin;
    if (n === name) {
      indices.unshift(i);
    }
  });
  for (const i of indices) {
    plugins.splice(i, 1);
  }
};
const babelPluginSyntaxTypeScript = declare((api, opts) => {
  api.assertVersion(7);
  const {
    disallowAmbiguousJSXLike,
    dts
  } = opts;
  {
    var {
      isTSX
    } = opts;
  }
  return {
    name: "syntax-typescript",
    manipulateOptions(opts, parserOpts) {
      {
        const {
          plugins
        } = parserOpts;
        removePlugin(plugins, "flow");
        removePlugin(plugins, "jsx");
        plugins.push("objectRestSpread", "classProperties");
        if (isTSX) {
          plugins.push("jsx");
        }
      }
      parserOpts.plugins.push(["typescript", {
        disallowAmbiguousJSXLike,
        dts
      }]);
    }
  };
});
export {babelPluginSyntaxTypeScript};
