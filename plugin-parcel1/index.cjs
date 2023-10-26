const { addTypeChecks } = require('runtime-type-inspector');
const JSAsset = require('parcel-bundler/src/assets/JSAsset.js');
class JSAssetPlayCanvas extends JSAsset {
  /**
   * @override
   * @returns {Promise<void>}
   */
  async pretransform() {
    this.contents = addTypeChecks(this.contents);
    // continue the normal flow
    return await super.pretransform();
  }
}
module.exports = JSAssetPlayCanvas;
