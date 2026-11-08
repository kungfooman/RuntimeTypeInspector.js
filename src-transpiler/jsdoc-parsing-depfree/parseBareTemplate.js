import {expandTypeDepFree} from "../expandTypeDepFree.js";
/** @import {ExpandType, ExpandTypeReturnType} from './parseJSDoc.js' */

/**
 * Reads one braceless `@template` head: `[A=X]` contributes its default
 * under `A`, a bare name stands in as any unless already bound.
 * @example
 * parseBareTemplate(Object.create(null), '[K=string]', expandTypeDepFree);
 * // {K: 'string'}
 * @param {Record<string, ExpandTypeReturnType>} templates - The record to fill.
 * @param {string} headRaw - The text after the tag.
 * @param {ExpandType} expandType - Type expander for defaults.
 * @returns {void}
 */
function parseBareTemplate(templates, headRaw, expandType) {
  const head = headRaw.trim();
  if (head.startsWith('[')) {
    const inner = head.slice(1, head.lastIndexOf(']'));
    const equals = inner.indexOf('=');
    if (equals !== -1) {
      const name = inner.slice(0, equals).trim();
      const def = inner.slice(equals + 1).trim();
      if (/^[a-zA-Z0-9_$]+$/.test(name) && def !== '') {
        templates[name] = expandType(def);
      }
    }
    return;
  }
  const name = head.split(/\s+/)[0] ?? '';
  if (/^[a-zA-Z0-9_$]+$/.test(name) && !(name in templates)) {
    templates[name] = 'any';
  }
}
export {parseBareTemplate};
