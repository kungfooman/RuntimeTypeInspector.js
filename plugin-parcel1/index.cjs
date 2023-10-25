const { addTypeChecks } = require("runtime-type-inspector/build/rti-transpiler.js");
const JSAsset = require("parcel-bundler/src/assets/JSAsset.js");
console.log("JSAsset", JSAsset);
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
