/**
 * Describes one overload signature for a runtime check call.
 * @param {*} tuple - Positional parameter tuple for one overload.
 * @param {Record<string, *>} templates - Template bindings for the signature.
 * @returns {{tuple: *, templates: Record<string, *>}} Signature record.
 * @example
 * import {expandType} from './expandType.js';
 * const tuple = overloadToTuple('@param {number} value', expandType);
 * overloadSignature(tuple, {}).tuple; // tuple
 */
function overloadSignature(tuple, templates) {
  return {tuple, templates};
}
export {overloadSignature};
