import {parseSync} from '@babel/core';
import {StringifierWithTypeAssertions} from './StringifierWithTypeAssertions.mjs';
import {expandType} from './expandType.mjs';
/**
 * Simple facade which does all the processing.
 * @param {string} src - The input source with JSDoc comments.
 * @returns {string} The output source with runtime type testing.
 */
function addTypeChecks(src) {
  try {
    const stringifierWithTypeAssertions = new StringifierWithTypeAssertions(expandType);
    const ast = parseSync(src);
    const out = stringifierWithTypeAssertions.toSource(ast);
    return out;
  } catch (e) {
    console.error(e);
    return `/*<addTypeChecks-error>*/${src}/*</addTypeChecks-error>*/`;
  }
}
export {addTypeChecks};
