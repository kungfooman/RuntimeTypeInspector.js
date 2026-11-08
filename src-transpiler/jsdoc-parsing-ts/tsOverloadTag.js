import {stripTsBraces} from './stripTsBraces.js';
import {tsParamTag} from './tsParamTag.js';

/**
 * Reads one TS `@overload` marker to the shared schema entry: TS emits
 * one `JSDocOverloadTag` per marker, each with its own signature, exactly
 * like the depfree per-section split. No merging anywhere.
 * @example
 * tsOverloadTag({typeExpression: {parameters: [], type: undefined}});
 * // {params: [], returns: ''}
 * @param {object} tag - TS JSDoc overload tag.
 * @returns {import('../jsdoc-parsing-depfree/canonicalDoc.js').CanonicalOverload} Canonical overload entry.
 */
function tsOverloadTag(tag) {
  const signature = tag.typeExpression;
  const params = (signature.parameters ?? []).map((parameter) => tsParamTag(parameter));
  const returns = signature.type && signature.type.typeExpression ?
    stripTsBraces(signature.type.typeExpression.getText()) :
    '';
  return {params, returns};
}
export {tsOverloadTag};
