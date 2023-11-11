import {createFilter} from '@rollup/pluginutils';
import {
  addTypeChecks, expandType, compareAST, code2ast2code
} from '@runtime-type-inspector/transpiler';
/**
 * Alternatively "import * as rti from ..." would also prevent "Unused external imports" warning...
 * or keeping log of every single call during RTI parsing.
 * @param {boolean} validateDivision
 */
function getHeader(validateDivision) {
  let header = "import { assertType, youCanAddABreakpointHere";
  if (validateDivision) {
    header += ", validateDivision";
  }
  header += ", registerTypedef, registerClass } from '@runtime-type-inspector/runtime';\n";
  // Prevent tree-shaking in UMD build so we can always "add a breakpoint here".
  header += "export * from '@runtime-type-inspector/runtime';\n";
  return header;
}
/**
 * @param {object} [options] - Optional options.
 * @param {boolean} [options.enable] - Enable or disable entire plugin. Defaults to true.
 * @param {boolean} [options.selftest] - Every once in a while Babel changes the AST, so we
 * self-test Stringifier class to ensure its functionanlity.
 * @param {string[]} [options.ignoredFiles] - Ignore certain files which operate in a different
 * context, for example framework/parsers/draco-worker.js operates as WebWorker (without RTI).
 * @returns {import('rollup').Plugin} The rollup plugin.
 */
function runtimeTypeInspector({enable = true, selftest = false, ignoredFiles} = {}) {
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
      const validateDivision = true;
      code = getHeader(validateDivision) + code;
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
