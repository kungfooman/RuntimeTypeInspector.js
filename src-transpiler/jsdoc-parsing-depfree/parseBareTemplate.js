import {expandTypeDepFree    } from "../expandTypeDepFree.js";
import {splitTemplateBindings} from "./splitTemplateBindings.js";
/** @import {ExpandType, ExpandTypeReturnType} from './parseJSDoc.js' */
/**
 * Reads one braceless `@template` head: each comma-separated binding
 * contributes its default under its name (`[A=X]`), a bare name stands
 * in as any unless already bound. tsc splits `@template O, P` into two
 * bindings, so the fold binds both instead of dropping the tail.
 * @example
 * parseBareTemplate(Object.create(null), '[K=string]', expandTypeDepFree);
 * // {K: 'string'}
 * @example
 * parseBareTemplate(Object.create(null), 'O, P The obj and props types', expandTypeDepFree);
 * // {O: 'any', P: 'any'}
 * @param {Record<string, ExpandTypeReturnType>} templates - The record to fill.
 * @param {string} headRaw - The text after the tag.
 * @param {ExpandType} expandType - Type expander for defaults.
 * @returns {void}
 */
function parseBareTemplate(templates, headRaw, expandType) {
  for (const binding of splitTemplateBindings(headRaw)) {
    if (binding.startsWith('[')) {
      const inner = binding.slice(1, binding.lastIndexOf(']'));
      const equals = inner.indexOf('=');
      if (equals !== -1) {
        const name = inner.slice(0, equals).trim();
        const def = inner.slice(equals + 1).trim();
        if (/^[a-zA-Z0-9_$]+$/.test(name) && def !== '') {
          templates[name] = expandType(def);
        }
      }
      continue;
    }
    const name = binding.split(/\s+/)[0] ?? '';
    if (/^[a-zA-Z0-9_$]+$/.test(name) && !(name in templates)) {
      templates[name] = 'any';
    }
  }
}
export {parseBareTemplate};
