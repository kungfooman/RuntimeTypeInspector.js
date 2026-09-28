const {existsSync, readFileSync} = require('fs');
const {join} = require('path');
const {addTypeChecks, expandType} = require('@runtime-type-inspector/transpiler');
const loaderUtils = require('loader-utils');
/**
 * Host project version funneled into the emitted header (`setProjectVersion`
 * in `Download log` meta): explicit loader option wins, else the version
 * from the host package.json in the build working directory, else unset
 * (the log then nudges toward setting it).
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
 * @param {string} source - The source.
 */
module.exports = function (source) {
  /** @type {import('@runtime-type-inspector/transpiler').Options} */
  const options = loaderUtils.getOptions(this);
  source = addTypeChecks(source, {...options, expandType, projectVersion: resolveProjectVersion(options.projectVersion)});
  this.callback(null, source);
};
