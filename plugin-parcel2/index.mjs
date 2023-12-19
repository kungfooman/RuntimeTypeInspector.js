import {Transformer} from '@parcel/plugin';
import {addTypeChecks} from '@runtime-type-inspector/transpiler';
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
    const code = addTypeChecks(source);
    asset.setCode(code);
    // Return the asset
    return [asset];
  }
});
