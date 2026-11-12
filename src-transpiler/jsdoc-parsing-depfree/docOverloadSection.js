import {parseJSDocDocument} from './parseJSDocDocument.js';
import {parseParamHead} from './parseParamHead.js';
import {makeParamTag} from './makeParamTag.js';
import {docParamTag} from './docParamTag.js';
/**
 * Lowers one overload section to the shared schema entry: each section's
 * params (names, brackets, brace text) and return type agree.
 * The head may carry the type itself (matter-js swaps the order:
 * `@param label {string}`), exactly like the flat path: tsc binds the
 * head's first word as the name and the first `{...}` group past it as
 * the type, so the section splits the same way.
 * A `@template` nested in a section binds nothing (tsc rejects it with
 * TS8039 and drops the section's rows with TS2304): the template itself
 * still binds flat from the tag source, so only the section rows drop.
 * @example
 * docOverloadSection('@param {string} label @param {...number[]} values @returns {number}');
 * // {params: [{name: 'label', ...}, {name: 'values', ...}], returns: 'number'}
 * @param {string} section - One overload section.
 * @returns {import('./canonicalDoc.js').CanonicalOverload} Canonical overload entry.
 */
function docOverloadSection(section) {
  // A template-first section stalls before any row (tsc emits the empty
  // marker and strands the rows to the tail), so the entry stays empty.
  // A template after rows rode the same marker that holds them: the
  // entry absorbs the whole piece (errors included) exactly as tsc
  // parses it. The gate tolerates ` * ` leaders like the split gate.
  if (/^[\s*]*@template\b/.test(section)) {
    return {params: [], returns: ''};
  }
  const sectionDoc = parseJSDocDocument(section);
  const params = (sectionDoc.tags ?? []).map((tag) => {
    const {name} = parseParamHead(tag.nameRaw ?? '');
    const group = tag.typeRaw === '' && name !== '' ? (tag.nameRaw ?? '').slice((tag.nameRaw ?? '').indexOf(name) + name.length).match(/\{([^{}]*)\}/) : null;
    const typeRaw = group !== null && group[1].trim() !== '' ? group[1] : tag.typeRaw;
    return docParamTag(makeParamTag(typeRaw, tag.nameRaw ?? ''), typeRaw);
  });
  const returns = section.match(/@returns?\s*\{([^}]*)\}/)?.[1] ?? '';
  return {params, returns};
}
export {docOverloadSection};
