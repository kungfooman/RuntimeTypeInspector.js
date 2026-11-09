import {parseJSDocDocument} from './parseJSDocDocument.js';
import {docParamTag} from './docParamTag.js';

/**
 * Lowers one overload section to the shared schema entry: each section's
 * params (names, brackets, brace text) and return type agree.
 * @example
 * docOverloadSection('@param {string} label @param {...number[]} values @returns {number}');
 * // {params: [{name: 'label', ...}, {name: 'values', ...}], returns: 'number'}
 * @param {string} section - One overload section.
 * @returns {import('./canonicalDoc.js').CanonicalOverload} Canonical overload entry.
 */
function docOverloadSection(section) {
  const sectionDoc = parseJSDocDocument(section);
  const params = (sectionDoc.tags ?? []).map((tag) => docParamTag(tag, tag.typeRaw));
  const returns = section.match(/@returns?\s*\{([^}]*)\}/)?.[1] ?? '';
  return {params, returns};
}
export {docOverloadSection};
