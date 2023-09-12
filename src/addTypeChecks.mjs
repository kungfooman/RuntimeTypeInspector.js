import { parseSync } from '@babel/core';
import { TypeStringifier } from './TypeStringifier.mjs';

/**
 * Simple facade which does all the processing.
 *
 * @param {string} src - The input source with JSDoc comments.
 * @returns {string} The output source with runtime type testing.
 */
function addTypeChecks(src) {
  try {
    const typeStringifier = new TypeStringifier();
    const ast = parseSync(src);
    const out = typeStringifier.toSource(ast);
    return out;
  } catch (e) {
    console.error(e);
    return `/*<addTypeChecks-error>*/${src}/*</addTypeChecks-error>*/`;
  }
}

export { addTypeChecks };
