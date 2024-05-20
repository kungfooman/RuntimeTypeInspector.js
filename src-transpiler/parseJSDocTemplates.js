import {expandTypeDepFree} from "./expandTypeDepFree.js";
/**
 * @typedef {typeof expandTypeDepFree} ExpandType
 * @typedef {ReturnType<ExpandType>} ExpandTypeReturnType
 */
/**
 * Parses JSDoc comments to extract parameter type information.
 *
 * @param {string} src - The JSDoc comment string to parse.
 * @param {ExpandType} [expandType] - An optional function to process the types found in the JSDoc.
 * @returns {Record<string, ExpandTypeReturnType> | undefined} An object mapping template names to their parsed types,
 * or `undefined` if no template tags were found.
 */
function parseJSDocTemplates(src, expandType = expandTypeDepFree) {
  const regexTemplateTyped = /@template \{(.*?)\} ([a-zA-Z0-9_$=]+)/g;
  const matches = [...src.matchAll(regexTemplateTyped)];
  if (!matches.length) {
    return;
  }
  /** @type {Record<string, ExpandTypeReturnType>} */
  const templates = Object.create(null);
  matches.forEach(_ => {
    const type = expandType(_[1].trim());
    const name = _[2].trim();
    templates[name] = type;
  });
  return templates;
}
export {parseJSDocTemplates};
