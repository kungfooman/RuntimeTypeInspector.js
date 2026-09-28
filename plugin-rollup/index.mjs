import {existsSync, readFileSync} from 'fs';
import {join} from 'path';
import {createFilter} from '@rollup/pluginutils';
import {
  addTypeChecks, expandType, compareAST, code2ast2code
} from '@runtime-type-inspector/transpiler';
/**
 * Host project version funneled into the emitted header (`setProjectVersion`
 * in `Download log` meta): explicit option wins, else the version from the
 * host package.json in the build working directory, else unset (the log
 * then nudges toward setting it).
 * @param {string} [explicit] - Explicit `projectVersion` option.
 * @returns {string|undefined} Resolved version or undefined.
 */
function resolveProjectVersion(explicit) {
  if (explicit !== undefined && explicit !== null) {
    return explicit;
  }
  try {
    const path = join(process.cwd(), 'package.json');
    if (!existsSync(path)) {
      return undefined;
    }
    const {version} = JSON.parse(readFileSync(path, 'utf8'));
    if (typeof version === 'string' && version) {
      return version;
    }
  } catch {
    // No readable host package.json: leave unset (log says so).
  }
  return undefined;
}
/**
 * @typedef OptionsProps
 * @property {boolean} [enable] - Enable or disable entire plugin. Defaults to true.
 * @property {boolean} [selftest] - Every once in a while Babel changes the AST, so we
 * self-test Stringifier class to ensure its functionanlity.
 * @property {string[]} [ignoredFiles] - Ignore certain files which operate in a different
 * context, for example framework/parsers/draco-worker.js operates as WebWorker (without RTI).
 * @property {boolean} [validateDivision] - Whether divisions are validated. Defaults to true.
 * @property {boolean} [inspectIndexedAccess] - Whether indexed accesses like
 * `arr[i]` are wrapped for bounds and integer validation. Disable to drop
 * indexed access inspection entirely. Defaults to true.
 * @property {string} [projectVersion] - Host project version for `Download
 * log` meta. Defaults to the host package.json version in the build working
 * directory; unset when none is readable (the log then nudges to set it).
 */
/**
 * @typedef {OptionsProps & import('@runtime-type-inspector/transpiler').Options} Options
 */
/**
 * @param {Options} [options] - Optional options.
 * @returns {import('rollup').Plugin} The rollup plugin.
 */
function runtimeTypeInspector({enable = true, selftest = false, ignoredFiles, ...options} = {}) {
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
        expandType,
        filename: id,
        ...options,
        projectVersion: resolveProjectVersion(options.projectVersion),
      });
      return {
        code,
        map: null
      };
    }
  };
}
export {runtimeTypeInspector};
