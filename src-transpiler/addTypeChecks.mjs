import {parse   } from '@babel/parser';
import {Asserter} from './Asserter.mjs';
/**
 * Simple facade which does all the processing. Processes the input
 * source string, adding runtime type checks based on JSDoc comments.
 *
 * This function takes JavaScript source code as input, parses it to an AST, traverses the
 * AST to find type annotations in JSDoc comments, and generates appropriate runtime type
 * assertions. These are then inserted into the source, producing a new version of the code
 * that includes runtime type checking based on the original JSDoc annotations.
 *
 * @param {string} src - The input source code containing JSDoc comments to be processed
 * for type checks.
 * @param {import('./Asserter.mjs').Options} [options] - Configuration options that dictate
 * how the processing is performed.
 * @returns {string} The transformed source code with inserted runtime type checks, or the
 * original source code commented with an error if processing fails.
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
