const {addTypeChecks, expandType} = require('@runtime-type-inspector/transpiler');
const JSAsset = require('parcel-bundler/src/assets/JSAsset.js');
class JSAssetRuntimeTypeInspector extends JSAsset {
  /**
   * @override
   * @returns {Promise<void>}
   */
  async pretransform() {
    this.contents = addTypeChecks(this.contents, {expandType, addHeader: false});
    // continue the normal flow
    return await super.pretransform();
  }
}
module.exports = JSAssetRuntimeTypeInspector;
