import {parseSync} from '@babel/core';
import {StringifierWithTypeAssertions} from './StringifierWithTypeAssertions.mjs';
/**
 * Simple facade which does all the processing.
 * @param {string} src - The input source with JSDoc comments.
 * @param {import('./StringifierWithTypeAssertions.mjs').Options} [options]
 * @returns {string} The output source with runtime type testing.
 */
function addTypeChecks(src, options) {
  try {
    const stringifierWithTypeAssertions = new StringifierWithTypeAssertions(options);
    const ast = parseSync(src);
    const out = stringifierWithTypeAssertions.toSource(ast);
    return out;
  } catch (e) {
    console.error(e);
    return `/*<addTypeChecks-error>*/${src}/*</addTypeChecks-error>*/`;
  }
}
export {addTypeChecks};
