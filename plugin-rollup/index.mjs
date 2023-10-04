import {createFilter } from '@rollup/pluginutils';
import {addTypeChecks} from '../src/addTypeChecks.mjs';
import {expandType   } from '../src/expandType.mjs';
/**
 * Alternatively "import * as rti from ..." would also prevent "Unused external imports" warning...
 * or keeping log of every single call during RTI parsing.
 * @param {boolean} validateDivision
 */
function getHeader(validateDivision) {
  let header = "import { assertType, youCanAddABreakpointHere";
  if (validateDivision) {
    header += ", validateDivision";
  }
  header += ", registerTypedef, registerClass } from 'runtime-type-inspector/src-rti/index.mjs';\n";
  // Prevent tree-shaking in UMD build so we can always "add a breakpoint here".
  header += "export * from 'runtime-type-inspector/src-rti/index.mjs';\n";
  return header;
}
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
        return;
      }
      const validateDivision = true;
      code = getHeader(validateDivision) + code;
      // todo expose options to rollup plugin
      code = addTypeChecks(code, {
        validateDivision,
        // ignoreLocations: ['Tensor#constructor'], // todo
        expandType,
        filename: id,
      });
      return {
        code,
        map: null
      };
    }
  };
}
export {runtimeTypeInspector};
