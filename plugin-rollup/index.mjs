import {createFilter} from '@rollup/pluginutils';
import {
  addTypeChecks, expandType, compareAST, code2ast2code
} from '@runtime-type-inspector/transpiler';
/**
 * @typedef Options
 * @property {boolean} [enable] - Enable or disable entire plugin. Defaults to true.
 * @property {boolean} [selftest] - Every once in a while Babel changes the AST, so we
 * self-test Stringifier class to ensure its functionanlity.
 * @property {string[]} [ignoredFiles] - Ignore certain files which operate in a different
 * context, for example framework/parsers/draco-worker.js operates as WebWorker (without RTI).
 * @property {boolean} [validateDivision] - Whether divisions are validated. Defaults to true.
 */
/**
 * @param {Options} [options] - Optional options.
 * @returns {import('rollup').Plugin} The rollup plugin.
 */
function runtimeTypeInspector({enable = true, selftest = false, ignoredFiles, validateDivision = true} = {}) {
  const filter = createFilter([
    '**/*.js'
  ], []);
  return {
    name: 'runtime-type-inspector',
    transform(code, id) {
      if (!enable || !filter(id)) {
        return;
      }
      // Ignore files which are supposed to run in e.g. a Worker context without RTI
      if (ignoredFiles?.some(_ => id.includes(_))) {
        return;
      }
      if (selftest) {
        const test = compareAST(code, code2ast2code(code));
        if (!test) {
          console.warn(`AST is NOT equal`);
        }
      }
      // todo expose options to rollup plugin
      code = addTypeChecks(code, {
        validateDivision,
        // ignoreLocations: ['Tensor#constructor'], // todo
        expandType,
        filename: id,
      });
      return {
        code,
        map: null
      };
    }
  };
}
export {runtimeTypeInspector};
