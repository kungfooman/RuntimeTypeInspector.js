import {expandTypeDepFree} from "./expandTypeDepFree.js";
import {parseJSDocDocument} from "./parseJSDocDocument.js";
/** @import {ExpandedType} from './expandedType.js' */
/**
 * @typedef {ReturnType<typeof parseJSDoc>} ParseJSDocReturnType
 */
/**
 * @typedef {typeof expandTypeDepFree} ExpandType
 * @typedef {ReturnType<ExpandType>} ExpandTypeReturnType
 */
/**
 * @typedef {object} ParamTag
 * @property {string} typeRaw - The raw text inside the braces.
 * @property {string} nameRaw - The head token text after the braces
 * (bracketed name with defaults, no trailing description).
 * @property {boolean} invalidRest - Whether the rest marker sits before the
 * name instead of inside the braces (`{number[]} ...values`).
 * @property {boolean} optional - Whether the name is bracketed (`[name]`).
 * @property {string} name - The parameter name with brackets and defaults stripped.
 * @property {{name: string, array: boolean}[]} [segments] - The dotted path
 * segments the name scanned into (`[]` groups mark array access); absent
 * when the head never scanned (invalid name).
 */
/**
 * Parses JSDoc comments to extract parameter type information. Thin view
 * over the single document parse: one scan feeds params, templates, and
 * the setter together, so `@overload` sections never disagree across views.
 * @example
 * parseJSDoc('@param {number} x'); // {x: 'number'}
 * @param {string} src - The JSDoc comment string to parse.
 * @param {ExpandType} [expandType] - An optional function to process the types found in the JSDoc.
 * @returns {Record<string, ExpandTypeReturnType> | undefined} An object mapping parameter names to their parsed types, or undefined if no parameters are found.
 */
function parseJSDoc(src, expandType = expandTypeDepFree) {
  return parseJSDocDocument(src, expandType).params;
}
export {parseJSDoc};
