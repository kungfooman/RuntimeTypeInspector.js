const {addTypeChecks} = require('@runtime-type-inspector/transpiler');
const loaderUtils = require('loader-utils');
/**
 * @param {string} source - The source.
 */
module.exports = function (source) {
  /** @type {import('@runtime-type-inspector/transpiler').Options} */
  const options = loaderUtils.getOptions(this);
  source = addTypeChecks(source, options);
  this.callback(null, source);
};
