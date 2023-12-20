import {Transformer} from '@parcel/plugin';
import {addTypeChecks, expandType} from '@runtime-type-inspector/transpiler';
export default new Transformer({
  async transform({asset}) {
    // Retrieve the asset's source code and source map.
    const source = await asset.getCode();
    //let sourceMap = await asset.getMap();
    // Run it through some compiler, and set the results
    // on the asset.
    //let {code, map} = compile(source, sourceMap);
    //asset.setCode(code);
    //asset.setMap(map);
    // Unfortunately Parcel generates unusable code while adding an import via plugin.
    // Not adding the import results in function calls that can simple be polyfilled into `window`.
    // TODO: Open issue on Parcel or find another way.
    const code = addTypeChecks(source, {expandType, addHeader: false});
    asset.setCode(code);
    // Return the asset
    return [asset];
  }
});
