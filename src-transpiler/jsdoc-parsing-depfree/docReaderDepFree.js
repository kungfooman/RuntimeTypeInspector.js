import {parseJSDocNodes} from './parseJSDocNodes.js';
import {makeParamTag} from './makeParamTag.js';
import {parseParamHead} from './parseParamHead.js';
import {readUnbracedType} from './readUnbracedType.js';
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
 * reads (mid-line braced `{T}` or a braceless clause tsc attaches):
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
      // The head may carry the type itself (matter-js swaps the order:
      // `@param ...plugin {Function} The plugins`): tsc binds the head's
      // first word as the name and the first `{...}` group past it as the
      // type, so the depfree side splits the same way — name from the
      // shared grammar (`parseParamHead` owns the name boundary),
      // type from the first non-empty group past the name. The group must
      // sit past the name (a leading group is a braced tag's type, never
      // a head's) and must not be the YUIDoc `{}` vacancy (`@param
      // module {}` binds nothing). The grammar reads the name on both
      // sides of the split, so the name and the type agree instead of
      // second-guessing each other.
      const name = parseParamHead(node.headRaw).name;
      const group = node.typeRaw === '' && name !== '' ? node.headRaw.slice(node.headRaw.indexOf(name) + name.length).match(/\{([^{}]*)\}/) : null;
      const typeRaw = group !== null && group[1].trim() !== '' ? group[1] : node.typeRaw;
      doc.params.push(docParamTag(makeParamTag(typeRaw, node.headRaw), typeRaw));
    } else if (node.tag === '@template') {
      doc.templates.push(...docTemplateNode(node));
    } else if (node.tag === '@returns' || node.tag === '@return') {
      doc.returns = node.typeRaw;
    } else if (node.tag === '@type') {
      // The node layer reads the clause through `readUnbracedType`; the
      // fallback only fires when the node bound nothing.
      if (node.typeRaw !== '') {
        doc.returns = node.typeRaw;
      }
    } else if (node.tag === '@callback') {
      // Callback rows follow as flat `@param` tags; they group under the
      // callback name, mirroring the TS nested signature. An inline type
      // (`@callback {function(...): ...} Fn`) carries no separate name on
      // either side (tsc parses it as the signature type with no `Fn`
      // binding), so the entry stays unnamed instead of splitting the
      // first brace word as a name.
      const head = node.headRaw.startsWith('{') ? '' : (node.headRaw.split(/\s+/)[0] ?? '');
      const entry = {name: head, params: []};
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
    // `{T}` (no consumed head before it, so the chain dropped it), a
    // clause the node bound nothing for, or an unbraced word tsc binds
    // wherever it sits. The brace scan balances, so nested generics read
    // whole; otherwise the clause re-reads through `readUnbracedType`
    // (which owns tsc's rest-of-line boundary) starting from the head the
    // node already sliced — or from the raw comment when no node exists.
    // Braced rows the nodes already read stay untouched, and prose
    // `@mentions` never reach here: the shared node scan already
    // declined them.
    const nodes = parseJSDocNodes(comment);
    const at = comment.search(/@type(?![\w$])/);
    if (at !== -1) {
      const head = nodes.find((node) => node.tag === '@type')?.headRaw;
      const rest = (head ?? comment.slice(at + '@type'.length)).split('\n')[0] ?? '';
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
        // An unbraced `@type` reads the clause tsc reparses after the
        // word: `readUnbracedType` splits trailing prose at the first
        // non-type token, so only the clause binds.
        doc.returns = readUnbracedType(rest);
      }
    }
  }
  return doc;
}
export {docReaderDepFree};
