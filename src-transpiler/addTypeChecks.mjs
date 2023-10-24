import {parse   } from '@babel/parser';
import {Asserter} from './Asserter.mjs';
/**
 * Simple facade which does all the processing.
 * @param {string} src - The input source with JSDoc comments.
 * @param {import('./Asserter.mjs').Options} [options]
 * @returns {string} The output source with runtime type testing.
 */
function addTypeChecks(src, options) {
  try {
    const asserter = new Asserter(options);
    const ast = parse(src, {sourceType: 'module'});
    const out = asserter.toSource(ast);
    return out;
  } catch (e) {
    console.error(e);
    return `/*<addTypeChecks-error>*/${src}/*</addTypeChecks-error>*/`;
  }
}
export {addTypeChecks};
