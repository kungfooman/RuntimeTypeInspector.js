import ts from 'typescript';
import {stripTsBraces} from './stripTsBraces.js';
import {tsParamTag} from './tsParamTag.js';
import {tsTemplateTag} from './tsTemplateTag.js';
import {tsOverloadTag} from './tsOverloadTag.js';
import {tsCallbackTag} from './tsCallbackTag.js';
import {tsDottedChildren} from './tsDottedChildren.js';

/**
 * Lowers one JSDoc comment through the TypeScript compiler to the shared
 * canonical document: the same `{templates, overloads, params, returns,
 * callbacks}` shape `parseJSDocDocument` produces, as JSON-serializable
 * data only (TS nodes never leak: they are circular and class-shaped).
 * Unrepresentable rows warn and continue like the depfree reader: a
 * missing container name binds nothing, absorbed dotted children
 * re-slice from source, and no TS diagnostic ever hard-fails the read.
 * @example
 * docReaderTS('@param {number} x');
 * // {templates: [], overloads: [], params: [{name: 'x', ...}], returns: '', callbacks: []}
 * @param {string} comment - JSDoc tag text without comment delimiters.
 * @returns {import('../jsdoc-parsing-depfree/canonicalDoc.js').CanonicalDoc} Canonical TS document.
 */
function docReaderTS(comment) {
  // TS only attaches JSDoc inside real comment delimiters; the depfree
  // reader takes bare tag text, so wrap here and keep one input shape.
  const source = ts.createSourceFile('docreader.ts', '/**\n' + comment + '\n*/\nfunction __docReader() {}', ts.ScriptTarget.Latest, true);
  const fn = source.statements[0];
  /** @type {import('../jsdoc-parsing-depfree/canonicalDoc.js').CanonicalDoc} */
  const doc = {templates: [], overloads: [], params: [], returns: '', callbacks: []};
  for (const tag of ts.getJSDocTags(fn) ?? []) {
    if (tag.kind === ts.SyntaxKind.JSDocOverloadTag) {
      doc.overloads.push(tsOverloadTag(tag));
      continue;
    }
    if (tag.kind === ts.SyntaxKind.JSDocTemplateTag) {
      doc.templates.push(tsTemplateTag(tag));
      continue;
    }
    if (tag.kind === ts.SyntaxKind.JSDocParameterTag) {
      doc.params.push(tsParamTag(tag));
      continue;
    }
    if (tag.kind === ts.SyntaxKind.JSDocReturnTag) {
      doc.returns = tag.typeExpression ? stripTsBraces(tag.typeExpression.getText()) : '';
      continue;
    }
    if (tag.kind === ts.SyntaxKind.JSDocCallbackTag) {
      doc.callbacks.push(tsCallbackTag(tag));
      continue;
    }
    if (tag.kind === ts.SyntaxKind.JSDocTypeTag) {
      doc.returns = tag.typeExpression ? stripTsBraces(tag.typeExpression.getText()) : '';
    }
  }
  // Dotted sub-params resolve into the container on the TS side, and the
  // container carries the absorbed text as its type: mark it merged and
  // re-slice the children from source so both readers cover every row.
  // The container row is found by head match over `@param` segments
  // (not lines, so mid-line children recover): `options` must not match
  // `options2`, and `@param` alone must not match `@paramfoo`. The
  // bracket strip keeps `[options.x]` findable under `options`; the
  // trailing strip keeps a bracketed container (`[options]`) findable
  // under `options` too.
  const segments = comment.split('@param');
  const atParam = (segment, name) => {
    const head = segment.match(/^\s*(\{[^{}]*\})?\s*(\S+)/);
    const raw = (head?.[2] ?? '').replace(/^\[/, '').replace(/\]$/, '');
    return raw === name || raw.startsWith(name + '.') || raw.startsWith(name + '[');
  };
  const out = [];
  for (const param of doc.params) {
    if (param.type.includes('@param')) {
      const container = param.name;
      const atTag = segments.findIndex((segment) => atParam(segment, container));
      out.push({...param, type: '', merged: true});
      out.push(...tsDottedChildren(container, comment, atTag + 1));
      continue;
    }
    out.push(param);
  }
  doc.params = out;
  // Callback rows group under their callback on the depfree side too;
  // never count them as flat implementation rows.
  const callbackNames = new Set(doc.callbacks.flatMap((entry) => entry.params.map((param) => param.name)));
  doc.params = doc.params.filter((param) => !callbackNames.has(param.name));
  return doc;
}
export {docReaderTS};
