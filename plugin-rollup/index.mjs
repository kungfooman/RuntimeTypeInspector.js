import { createFilter } from '@rollup/pluginutils';
import { addTypeChecks } from '../src/addTypeChecks.mjs';
import { expandType } from '../src/expandType.mjs';
// todo getHeader() and only import what's required
const header = "import { assertType, youCanAddABreakpointHere, validateDivision, registerTypedef } from 'runtime-type-inspector';\n";
/**
 * @param {boolean} enable 
 * @returns {import('rollup').Plugin}
 */
function runtimeTypeInspector(enable) {
  console.log("FILTER ENABLED: ", enable);
  const filter = createFilter([
    '**/*.js'
  ], []);
  return {
    name: 'runtime-type-inspector',
    transform(code, id) {
      if (!enable || !filter(id)) {
        return undefined;
      }
      code = header + code;
      // todo expose options to rollup plugin
      code = addTypeChecks(code, {
        validateDivision: false,
        ignoreLocations: ['Tensor#constructor'], // todo
        expandType,
      });
      return {
        code,
        map: null
      };
    }
  };
}
export {runtimeTypeInspector};
