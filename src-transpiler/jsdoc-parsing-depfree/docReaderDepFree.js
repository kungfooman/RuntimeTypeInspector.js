import {expandTypeDepFree} from '../expandTypeDepFree.js';
import {parseJSDocNodes} from './parseJSDocNodes.js';
import {parseJSDocDocument} from './parseJSDocDocument.js';
import {makeParamTag} from './makeParamTag.js';
import {splitOverloadSections} from './splitOverloadSections.js';

/**
 * Reads one parameter node to the shared schema row. The name is the
 * validated bind name (empty when the tag binds nothing, like tsc's
 * empty name): raw head text is diagnostics, not parity business.
 * @param {{name: string, optional: boolean, invalidRest: boolean}} tag - Raw depfree param tag.
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

/**
 * Lowers one template node to the shared schema row: the head splits
 * into binding name and `= default`, the brace text is the constraint.
 * @param {{typeRaw: string, headRaw: string}} node - Raw tag node.
 * @returns {{name: string, constraint: string, default: string}} Canonical template.
 */
function docTemplateNode(node) {
  const head = node.headRaw.trim().split(/\s+/)[0] ?? '';
  const match = head.match(/^\[([A-Za-z_$][\w$]*)(?:=(.*))?\]$/);
  if (match) {
    return {name: match[1], constraint: node.typeRaw, default: (match[2] ?? '').trim()};
  }
  return {name: head, constraint: node.typeRaw, default: ''};
}

/**
 * Lowers one overload section to the shared schema entry: each section's
 * params (names, brackets, brace text) and return type agree.
 * @param {string} section - One overload section.
 * @returns {import('./canonicalDoc.js').CanonicalOverload} Canonical overload entry.
 */
function docOverloadSection(section) {
  const sectionDoc = parseJSDocDocument(section);
  const params = (sectionDoc.tags ?? []).map((tag) => docParamTag(tag, tag.typeRaw));
  const returns = section.match(/@returns?\s*\{([^}]*)\}/)?.[1] ?? '';
  return {params, returns};
}

/**
 * Lowers one JSDoc comment through the dependency-free reader to the
 * shared canonical document: the same `{templates, overloads, params,
 * returns, callbacks}` shape `docReaderTS` produces, as
 * JSON-serializable data only. This is the default reader: no TS
 * install, same token scan the fold uses, so the rows and the runtime
 * types can never disagree.
 * @example
 * docReaderDepFree('@param {number} x');
 * // {templates: [], overloads: [], params: [{name: 'x', ...}], returns: '', callbacks: []}
 * @param {string} comment - JSDoc tag text without comment delimiters.
 * @returns {import('./canonicalDoc.js').CanonicalDoc} Canonical depfree document.
 */
function docReaderDepFree(comment) {
  /** @type {import('./canonicalDoc.js').CanonicalDoc} */
  const doc = {templates: [], overloads: [], params: [], returns: '', callbacks: []};
  const sections = splitOverloadSections([comment]);
  if (sections.overloads.length > 0) {
    for (const node of parseJSDocNodes(comment)) {
      if (node.tag === '@template') {
        doc.templates.push(docTemplateNode(node));
      }
    }
    for (const section of sections.overloads) {
      doc.overloads.push(docOverloadSection(section));
    }
    if (sections.impl !== undefined && sections.impl !== null && sections.impl !== '') {
      for (const node of parseJSDocNodes(sections.impl)) {
        if (node.tag === '@param') {
          doc.params.push(docParamTag(makeParamTag(node.typeRaw, node.headRaw), node.typeRaw));
        } else if (node.tag === '@returns' || node.tag === '@return') {
          doc.returns = sections.impl.match(/@returns?\s*\{([^}]*)\}/)?.[1] ?? '';
        }
      }
    }
    return doc;
  }
  for (const node of parseJSDocNodes(comment)) {
    if (node.tag === '@param') {
      doc.params.push(docParamTag(makeParamTag(node.typeRaw, node.headRaw), node.typeRaw));
    } else if (node.tag === '@template') {
      doc.templates.push(docTemplateNode(node));
    } else if (node.tag === '@returns' || node.tag === '@return') {
      doc.returns = node.typeRaw;
    } else if (node.tag === '@type') {
      doc.returns = node.typeRaw;
    } else if (node.tag === '@callback') {
      // Callback rows follow as flat `@param` tags; they group under the
      // callback name, mirroring the TS nested signature.
      const name = node.headRaw.split(/\s+/)[0] ?? '';
      const entry = {name, params: []};
      doc.callbacks.push(entry);
      const rows = parseJSDocNodes(comment);
      const start = rows.findIndex((row) => row.tag === '@callback' && row.headRaw === node.headRaw);
      for (const row of rows.slice(start + 1)) {
        if (row.tag !== '@param') {
          break;
        }
        entry.params.push(docParamTag(makeParamTag(row.typeRaw, row.headRaw), row.typeRaw));
      }
    }
  }
  // Callback rows group under their callback; they never count as flat
  // implementation rows. Dotted rows stay flat here (the fold needs
  // them); the `merged` flag on the TS side records where tsc nests them.
  const callbackNames = new Set(doc.callbacks.flatMap((entry) => entry.params.map((param) => param.name)));
  doc.params = doc.params.filter((param) => !callbackNames.has(param.name));
  return doc;
}
export {docReaderDepFree};
