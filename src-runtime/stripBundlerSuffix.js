/**
 * Strips a bundler deconfliction suffix from a constructor name: bundlers
 * rename duplicate bindings by appending `$` plus digits (`Equation`
 * becomes `Equation$6` when many CommonJS modules declare their own
 * local), so the runtime name no longer matches the JSDoc spelling. Only
 * a trailing `$<digits>` strips, so real names survive untouched.
 * @param {string} name - The constructor name as seen at runtime.
 * @returns {string} The name with the bundler suffix removed.
 * @example
 * stripBundlerSuffix('ContactEquation$4'); // 'ContactEquation'
 * stripBundlerSuffix('Vec3'); // 'Vec3'
 */
function stripBundlerSuffix(name) {
  return name.replace(/\$\d+$/, '');
}
export {stripBundlerSuffix};
