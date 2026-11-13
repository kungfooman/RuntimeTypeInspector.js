import {expandTypeDepFree } from "../expandTypeDepFree.js";
import {parseJSDocDocument} from "./parseJSDocDocument.js";
/** @import {ExpandType, ExpandTypeReturnType} from './parseJSDoc.js' */
/**
 * Parses JSDoc comments to extract template type information. Thin view
 * over the single document parse: the document feeds params, templates,
 * and the setter from the same tag scan.
 * @example
 * parseJSDocTemplates('@template {string} [K=string]'); // {K: 'string'}
 * @param {string} src - The JSDoc comment string to parse.
 * @param {ExpandType} [expandType] - An optional function to process the types found in the JSDoc.
 * @returns {Record<string, ExpandTypeReturnType> | undefined} An object mapping template names to their parsed types,
 * or `undefined` if no template tags were found.
 */
function parseJSDocTemplates(src, expandType = expandTypeDepFree) {
  return parseJSDocDocument(src, expandType).templates;
}
export {parseJSDocTemplates};
