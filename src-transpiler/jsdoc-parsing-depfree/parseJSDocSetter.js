import {expandTypeDepFree} from "../expandTypeDepFree.js";
import {parseJSDocDocument} from "./parseJSDocDocument.js";
/** @import {ExpandedType} from './expandedType.js' */

/**
 * Thin view over the single document parse: the setter type (exactly one
 * `@type` tag) out of the shared scan.
 * @param {string} src - JSDoc comment of the setter.
 * @param {Function} expandType - The expandType function.
 * @returns {ExpandedType | undefined} The parsed and possibly expanded type from
 * the JSDoc comment, or undefined if parsing fails to find `@type`.
 */
function parseJSDocSetter(src, expandType = expandTypeDepFree) {
  return parseJSDocDocument(src, expandType).setter;
}
export {parseJSDocSetter};
