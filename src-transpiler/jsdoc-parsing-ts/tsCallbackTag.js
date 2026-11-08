import {tsParamTag} from './tsParamTag.js';

/**
 * Reads one TS `@callback` tag to the shared schema entry. Callback
 * params nest in the signature; the schema carries them as a callback
 * entry with the same parameter shape, so nesting compares as data.
 * @example
 * tsCallbackTag({fullName: {getText: () => 'Swap'}, typeExpression: {parameters: []}});
 * // {name: 'Swap', params: []}
 * @param {object} tag - TS JSDoc callback tag.
 * @returns {import('../jsdoc-parsing-depfree/canonicalDoc.js').CanonicalCallback} Canonical callback entry.
 */
function tsCallbackTag(tag) {
  const signature = tag.typeExpression;
  return {
    name: tag.fullName?.getText() ?? '',
    params: (signature.parameters ?? []).map((parameter) => tsParamTag(parameter)),
  };
}
export {tsCallbackTag};
