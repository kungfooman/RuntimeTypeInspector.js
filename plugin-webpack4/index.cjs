const {Compilation, Compiler} = require('webpack');
/**
 * @typedef OptionsProps
 * @property {RegExp} [test] - Test for file extensions.
 * @property {RegExp} [exclude] - Test for exclusion.
 */
/**
 * @typedef {OptionsProps & import('@runtime-type-inspector/transpiler').Options} Options
 */
class RuntimeTypeInspectorPlugin {
  static pluginName = 'RuntimeTypeInspectorPlugin';
  // Default options
  options = {
    // These file extensions are transpiled by default.
    test: /\.[cm]?js(\?.*)?$/i,
    // By default, files under node_modules are not processed.
    exclude: /node_modules/
  };
  /**
   * @param {Options} options - The options.
   */
  constructor(options) {
    Object.assign(this.options, options);
  }
  /**
   * @param {Compiler} compiler - The compiler.
   */
  apply(compiler) {
    compiler.hooks.thisCompilation.tap(
      RuntimeTypeInspectorPlugin.pluginName,
      /**
       * @param {Compilation} compilation - The compilation.
       */
      (compilation) => {
        compilation.hooks.normalModuleLoader.tap(
        //compiler.webpack.NormalModule.getCompilationHooks(compilation).loader.tap(
          RuntimeTypeInspectorPlugin.pluginName,
          /**
           * @param {object} loaderContext - The loader context.
           * @param {import('webpack').NormalModule} module - The module.
           */
          (loaderContext, module) => {
            const {userRequest} = module;
            const {test, exclude} = this.options;
            const retTest = test.test(userRequest);
            const retExclude = exclude.test(userRequest);
            // console.log('userRequest', userRequest, {retTest, retExclude});
            if (!retTest || retExclude) {
              return;
            }
            const {options} = this;
            const loader = require.resolve(__dirname + '/loader.cjs');
            module.loaders.push({options, loader});
          }
        );
      }
    );
  }
}
module.exports = {RuntimeTypeInspectorPlugin};
