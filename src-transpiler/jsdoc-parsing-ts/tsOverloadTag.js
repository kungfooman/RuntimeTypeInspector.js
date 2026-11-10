import {stripTsBraces} from './stripTsBraces.js';
import {tsParamTag} from './tsParamTag.js';
import {tsDottedChildren} from './tsDottedChildren.js';
import {recoverTildeTag} from './recoverTildeTag.js';

/**
 * Reads one TS `@overload` marker to the shared schema entry: TS emits
 * one `JSDocOverloadTag` per marker, each with its own signature, exactly
 * like the depfree per-section split. No merging anywhere.
 * A container row absorbs its dotted children as type text inside the
 * signature (the playcanvas `script/component.js` `args` shape), so the
 * nested params un-merge the same way the flat tail and the callback
 * branch do: container marked, children re-sliced from the collected
 * parameter text (segment 0 is preamble, 1 is the container head, the
 * children start at 2).
 * @example
 * tsOverloadTag({typeExpression: {parameters: [], type: undefined}});
 * // {params: [], returns: ''}
 * @param {object} tag - TS JSDoc overload tag.
 * @returns {import('../jsdoc-parsing-depfree/canonicalDoc.js').CanonicalOverload} Canonical overload entry.
 */
function tsOverloadTag(tag) {
  const signature = tag.typeExpression;
  const params = (signature.parameters ?? []).map((parameter) => tsParamTag(parameter));
  for (const [index, parameter] of params.entries()) {
    if (parameter.type.includes('@param') === false) {
      continue;
    }
    const tail = signature.parameters[index]?.getText?.() ?? '';
    const inner = '@param ' + tail.split('@param').slice(1).join('@param');
    const nested = tsDottedChildren(parameter.name, inner, 2);
    params.splice(index, 1, {...parameter, type: '', merged: true}, ...nested);
  }
  let returns = '';
  if (signature.type && signature.type.typeExpression) {
    const parsed = stripTsBraces(signature.type.typeExpression.getText());
    returns = recoverTildeTag(signature.type.getText?.(), parsed)?.typeRaw ?? parsed;
  }
  return {params, returns};
}
export {tsOverloadTag};
