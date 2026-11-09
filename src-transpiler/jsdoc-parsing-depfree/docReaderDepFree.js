import {parseJSDocNodes} from './parseJSDocNodes.js';
import {makeParamTag} from './makeParamTag.js';
import {splitOverloadSections} from './splitOverloadSections.js';
import {docParamTag} from './docParamTag.js';
import {docTemplateNode} from './docTemplateNode.js';
import {docOverloadSection} from './docOverloadSection.js';

/**
 * Lowers one JSDoc comment through the dependency-free reader to the
 * shared canonical document: the same `{templates, overloads, params,
 * returns, callbacks}` shape `docReaderTS` produces, as
 * JSON-serializable data only. This is the default reader: no TS
 * install, same token scan the fold uses, so the rows and the runtime
 * types can never disagree. A lone `@type` with no node behind it still
 * reads (mid-line braced `{T}` or a braceless class word tsc attaches):
 * the brace scan balances, so nested generics read whole.
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
        doc.templates.push(...docTemplateNode(node));
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
      doc.templates.push(...docTemplateNode(node));
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
  if (doc.returns === '') {
    // A lone `@type` with no node behind it still reads: mid-line braced
    // `{T}` (no consumed head before it, so the chain dropped it) or a
    // braceless class word tsc attaches wherever it sits. The brace scan
    // balances, so nested generics read whole; a `{` clause after an
    // unbraced word stays out (that row is the TS reader's taxonomy: its
    // reparse owns the whole clause, and only an intersection-capable
    // expander narrows it). Braced rows the nodes already read stay
    // untouched, and prose `@mentions` never reach here: the shared node
    // scan already declined them.
    const at = comment.search(/@type(?![\w$])/);
    if (at !== -1) {
      const rest = comment.slice(at + '@type'.length);
      const brace = rest.match(/^\s*\{/);
      if (brace) {
        const after = rest.slice(brace[0].length);
        let depth = 1;
        let end = -1;
        for (let i = 0; i < after.length; i += 1) {
          if (after[i] === '{') {
            depth += 1;
          } else if (after[i] === '}') {
            depth -= 1;
            if (depth === 0) {
              end = i;
              break;
            }
          }
        }
        if (end !== -1) {
          doc.returns = after.slice(0, end);
        }
      } else {
        // An unbraced `@type` word reads one token: a class name, an
        // import path. A `{` clause after it stays out here: that row is
        // the TS reader's taxonomy (its reparse owns the whole clause),
        // and only its own class covers it.
        const word = rest.match(/^\s*([A-Za-z_$][\w$]*)(?!\s*\{)/);
        if (word) {
          doc.returns = word[1];
        }
      }
    }
  }
  return doc;
}
export {docReaderDepFree};
