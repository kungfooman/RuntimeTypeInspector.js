const {version} = require('webpack');
if (parseInt(version) <= 4) {
  module.exports = require('@runtime-type-inspector/plugin-webpack4');
} else {
  module.exports = require('@runtime-type-inspector/plugin-webpack5');
}
