import {recurseCandidates} from "./templateCandidates.js";
/**
 * Computes all concrete strings a structured `templateLiteral` type can produce.
 * @param {object} expect - The structured `templateLiteral` type.
 * @param {string[]} expect.quasis - The literal chunks.
 * @param {import('./validateType.js').Type[]} expect.types - The interpolated types.
 * @param {console["warn"]} warn - Function to warn with.
 * @param {number} [depth] - The depth to detect recursion.
 * @returns {string[]|undefined} All possible strings or `undefined` if not enumerable.
 * @example
 * resolveTemplateLiteralValues({quasis: ['a', 'b'], types: ['"x"']}, console.warn); // ['axb']
 */
function resolveTemplateLiteralValues(expect, warn, depth = 0) {
  const {quasis, types} = expect;
  /** @type {string[]} */
  let values = [quasis[0]];
  for (let i = 0; i < types.length; i++) {
    const candidates = recurseCandidates(types[i], warn, depth);
    if (!candidates) {
      return;
    }
    /** @type {string[]} */
    const next = [];
    for (const prefix of values) {
      for (const candidate of candidates) {
        next.push(prefix + candidate + quasis[i + 1]);
      }
    }
    values = next;
  }
  return values;
}
export {resolveTemplateLiteralValues};
