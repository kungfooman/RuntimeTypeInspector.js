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
        return undefined;
      }
      code = getHeader() + code;
      const validateDivision = false;
      // todo expose options to rollup plugin
      code = addTypeChecks(code, {
        validateDivision,
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
