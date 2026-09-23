import {extractCurlyContent} from './parseJSDocTypedef.js';
/**
 * Extracts an inline `/** @type {X} *\/` annotation from parameter comments
 * (issue #41), e.g. `function add(/** @type {number} *\/ a) {...}`.
 * @param {Array<{value: string}>|undefined} leadingComments - Leading comments of a param node.
 * @param {Function} expandType - Function expanding a type string.
 * @returns {any} Expanded type or `undefined` when no inline `@type` found.
 */
function parseInlineParamType(leadingComments, expandType) {
  if (!Array.isArray(leadingComments)) {
    return;
  }
  for (let i = leadingComments.length - 1; i >= 0; i--) {
    const {value} = leadingComments[i];
    if (!value || !value.includes('@type')) {
      continue;
    }
    const {content} = extractCurlyContent(value.slice(value.indexOf('@type')));
    if (!content || !content.trim()) {
      continue;
    }
    return expandType(content.trim());
  }
}
export {parseInlineParamType};
