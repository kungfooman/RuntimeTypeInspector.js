/** @import {ParamTag} from './parseJSDoc.js' */

/**
 * Reads one parameter node to the shared schema row. The name is the
 * validated bind name (empty when the tag binds nothing, like tsc's
 * empty name): raw head text is diagnostics, not parity business.
 * @example
 * docParamTag({name: 'x', optional: false, invalidRest: false}, 'number');
 * // {name: 'x', bracketed: false, type: 'number',
 * //  dropped: false, merged: false}
 * @example
 * docParamTag({name: '...values', optional: false, invalidRest: true}, 'number[]');
 * // {name: '...values', bracketed: false, type: 'number[]',
 * //  dropped: true, merged: false}
 * @param {ParamTag} tag - Raw depfree param tag.
 * @param {string} typeRaw - Brace text (the tag's own, for flat rows).
 * @returns {import('./canonicalDoc.js').CanonicalParam} Canonical parameter.
 */
function docParamTag(tag, typeRaw) {
  return {
    name: tag.name.split(/\s+/)[0].split('=')[0] ?? '',
    bracketed: tag.optional === true,
    type: typeRaw,
    dropped: tag.invalidRest === true || tag.name === '',
    merged: false,
  };
}
export {docParamTag};
