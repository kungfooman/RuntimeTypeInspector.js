import ts from 'typescript';
import {parseJSDocNodes} from '../jsdoc-parsing-depfree/parseJSDocNodes.js';
import {docTemplateNode} from '../jsdoc-parsing-depfree/docTemplateNode.js';
import {balancedBraceInner} from './balancedBraceInner.js';
import {parseParamHead} from '../jsdoc-parsing-depfree/parseParamHead.js';
import {stripTsBraces} from './stripTsBraces.js';
import {tsParamTag} from './tsParamTag.js';
import {tsTemplateTag} from './tsTemplateTag.js';
import {tsOverloadTag} from './tsOverloadTag.js';
import {tsCallbackTag} from './tsCallbackTag.js';
import {tsDottedChildren} from './tsDottedChildren.js';
import {recoverTildeTag} from './recoverTildeTag.js';
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
  const text = `/**\n${comment}\n*/\nfunction __docReader() {}`;
  const source = ts.createSourceFile('docreader.ts', text, ts.ScriptTarget.Latest, true);
  const [fn] = source.statements;
  /** @type {import('../jsdoc-parsing-depfree/canonicalDoc.js').CanonicalDoc} */
  const doc = {templates: [], overloads: [], params: [], returns: '', callbacks: []};
  for (const tag of ts.getJSDocTags(fn) ?? []) {
    if (tag.kind === ts.SyntaxKind.JSDocOverloadTag) {
      doc.overloads.push(tsOverloadTag(tag));
      // Rows nested in the marker die with it: a `@template` the marker
      // absorbs never surfaces as a tag (tsc rejects it with TS8039),
      // so it binds here from the marker's own text like the depfree
      // whole-comment scan does — the same precedent as the callback
      // branch, which binds trailing templates from tag source.
      const text = tag.getText?.() ?? '';
      for (const node of parseJSDocNodes(text)) {
        if (node.tag === '@template') {
          doc.templates.push(...docTemplateNode(node));
        }
      }
      continue;
    }
    if (tag.kind === ts.SyntaxKind.JSDocTemplateTag) {
      doc.templates.push(...tsTemplateTag(tag));
      continue;
    }
    if (tag.kind === ts.SyntaxKind.JSDocParameterTag) {
      doc.params.push(tsParamTag(tag));
      continue;
    }
    if (tag.kind === ts.SyntaxKind.JSDocReturnTag) {
      const parsed = tag.typeExpression ? stripTsBraces(tag.typeExpression.getText()) : '';
      doc.returns = recoverTildeTag(tag.getText?.(), parsed)?.typeRaw ?? parsed;
      continue;
    }
    if (tag.kind === ts.SyntaxKind.JSDocCallbackTag) {
      // TS parses the whole callback tail (prose, `@param` rows and a
      // trailing `@returns`) into one `JSDocSignature`: the return sits in
      // `signature.type` as its own `JSDocReturnTag` node, exactly like an
      // overload signature's return, so it reads the same way (the
      // depfree side lowers the same trailing `@returns` to top-level
      // `returns`, and the readers agree instead of dropping it here).
      // Three callback-only gaps close around it. First, the trailing
      // rows never surface as tags: an `@template` nested in the tail
      // dies with the signature (flat `@template` is order-blind —
      // `@param` before `@template` reads on both sides), so it binds
      // here from the tag's own source like the depfree row does.
      // Second, a container row absorbs its dotted children as type
      // text inside the signature, so the nested params un-merge the
      // same way the flat tail below does. Third, the return sees the
      // tilde path too: a leading `~` truncates the node to an empty
      // brace, which `recoverTildeTag` declines, so the callback form
      // re-slices the raw group whenever the parse is empty.
      const callback = tsCallbackTag(tag);
      const signature = tag.typeExpression;
      const text = tag.getText?.() ?? '';
      for (const node of parseJSDocNodes(text)) {
        if (node.tag === '@template') {
          doc.templates.push(...docTemplateNode(node));
        }
      }
      // rows collect first and splice once: a fixed-index splice inside
      // the loop corrupts the tail whenever one row absorbs rows after
      // it (two dotted containers lose their join), so each entry lands
      // at its shifted home instead.
      const rows = [];
      for (const [index, parameter] of callback.params.entries()) {
        if (parameter.type.includes('@param') === false) {
          rows.push(parameter);
          continue;
        }
        // The container's type text is the raw remaining tag line(s), not
        // a tag segment: one splitter segment holds the whole tail, so
        // re-slice from the container head inside the collected type text
        // (segment 0 is `@param`-free preamble, 1 is the container head
        // itself, the children start at 2 — the same caller contract as
        // the flat tail, which passes the comment with the container at
        // its own segment).
        const tail = signature.parameters[index]?.getText?.() ?? '';
        const inner = '@param ' + tail.split('@param').slice(1).join('@param');
        const nested = tsDottedChildren(parameter.name, inner, 2);
        rows.push({...parameter, type: '', merged: true}, ...nested);
      }
      callback.params = rows;
      if (signature.type && signature.type.typeExpression) {
        const returnText = signature.type.typeExpression.getText();
        const parsed = stripTsBraces(returnText);
        const tilde = recoverTildeTag(signature.type.getText?.(), parsed);
        if (tilde !== null) {
          doc.returns = tilde.typeRaw;
        } else if (parsed === '' && typeof returnText === 'string') {
          // An empty parse means tsc bailed on the spelling (leading
          // `~` empties the node): the raw group reads whole, matching
          // the depfree row exactly. No braces, no recovery.
          doc.returns = balancedBraceInner(signature.type.getText?.() ?? '')?.text ?? '';
        } else {
          doc.returns = tilde?.typeRaw ?? parsed;
        }
      }
      doc.callbacks.push(callback);
      continue;
    }
    if (tag.kind === ts.SyntaxKind.JSDocTypeTag) {
      // tsc's own text is the contract: `stripTsBraces` unwraps the type
      // node — stripping the cast tail's orphan `;` when the braces
      // balance without it (the svelte shape `...; }`), re-balancing the
      // recovery tail when they do not — and `recoverTildeTag` restores
      // tilde spellings. The strip never fires on a function tail: an
      // already-balanced `() => void & {...}` with no `;` keeps its own
      // `}`.
      const parsed = tag.typeExpression ? stripTsBraces(tag.typeExpression.getText()) : '';
      doc.returns = recoverTildeTag(tag.getText?.(), parsed)?.typeRaw ?? parsed;
    }
  }
  // Dotted sub-params resolve into the container on the TS side, and the
  // container carries the absorbed text as its type: mark it merged and
  // re-slice the children from source so both readers cover every row.
  // The container row is found by parsed-name match over `@param`
  // segments (not lines, so mid-line children recover): the single
  // depfree head grammar reads `[options]`, `[options={}]`, and bare
  // `options` all as `options`, so bracketed and defaulted containers
  // match exactly and the first child is never mistaken for the
  // container. `options` must not match `options2`: the grammar parses
  // whole names, so prefix collisions cannot occur.
  const segments = comment.split('@param');
  const atParam = (segment, name) => {
    const head = segment.match(/^\s*(\{[^{}]*\})?\s*(\S+)/);
    if (head === null) {
      return false;
    }
    const parsed = parseParamHead(head[2]);
    return parsed.valid === true && parsed.name === name;
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
  const names = (entry) => entry.params.map((param) => param.name);
  const callbackNames = new Set(doc.callbacks.flatMap(names));
  doc.params = doc.params.filter((param) => !callbackNames.has(param.name));
  return doc;
}
export {docReaderTS};
