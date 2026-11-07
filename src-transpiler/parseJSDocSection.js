import {expandTypeDepFree} from "./expandTypeDepFree.js";
import {parseJSDocDocument} from "./parseJSDocDocument.js";
/** @import {ExpandedType} from './expandedType.js' */
/** @import {ExpandType, ExpandTypeReturnType, ParamTag} from './parseJSDoc.js' */

/**
 * Reads one JSDoc text into parameter types plus the raw tags behind them.
 * Thin view over the single document parse: the returned record holds
 * expanded types while each tag keeps the verbatim brace text the expander
 * erased, so overload tuples can detect rest markers without rescanning.
 * @example
 * parseJSDocSection('@param {...number[]} values');
 * // {params: {values: {type: 'array', elementType: 'number'}},
 * //  tags: [{typeRaw: '...number[]', name: 'values', ...}]}
 * @param {string} src - The JSDoc comment string to parse.
 * @param {ExpandType} [expandType] - An optional function to process the types found in the JSDoc.
 * @returns {{params: Record<string, ExpandTypeReturnType> | undefined, tags: ParamTag[]}} Expanded params with raw tags.
 */
function parseJSDocSection(src, expandType = expandTypeDepFree) {
  const {params, tags} = parseJSDocDocument(src, expandType);
  return {params, tags};
}
export {parseJSDocSection};
