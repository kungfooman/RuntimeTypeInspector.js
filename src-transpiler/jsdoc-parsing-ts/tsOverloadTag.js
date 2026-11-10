import {stripTsBraces} from './stripTsBraces.js';
import {tsParamTag} from './tsParamTag.js';
import {tsDottedChildren} from './tsDottedChildren.js';
import {balancedBraceInner} from './balancedBraceInner.js';
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
 * children start at 2). A leading `~` in the return empties the TS
 * node, which `recoverTildeTag` declines on purpose: the raw group
 * re-slices instead, the same fallback the callback branch takes (a
 * braced mid-line tail can never reach here — the signature owns it —
 * so a matched group is the type, and absence means no type at all).
 * @example
 * tsOverloadTag({typeExpression: {parameters: [], type: undefined}});
 * // {params: [], returns: ''}
 * @param {object} tag - TS JSDoc overload tag.
 * @returns {import('../jsdoc-parsing-depfree/canonicalDoc.js').CanonicalOverload} Canonical overload entry.
 */
function tsOverloadTag(tag) {
  const signature = tag.typeExpression;
  const lowered = (signature.parameters ?? []).map((parameter) => tsParamTag(parameter));
  // Rows collect first and splice once: a fixed-index splice inside the
  // loop corrupts the tail whenever one row absorbs rows after it (two
  // dotted containers lose their join), so each entry lands at its
  // shifted home instead.
  const params = [];
  for (const [index, parameter] of lowered.entries()) {
    if (parameter.type.includes('@param') === false) {
      params.push(parameter);
      continue;
    }
    const tail = signature.parameters[index]?.getText?.() ?? '';
    const inner = '@param ' + tail.split('@param').slice(1).join('@param');
    const nested = tsDottedChildren(parameter.name, inner, 2);
    params.push({...parameter, type: '', merged: true}, ...nested);
  }
  let returns = '';
  if (signature.type && signature.type.typeExpression) {
    const parsed = stripTsBraces(signature.type.typeExpression.getText());
    const tilde = recoverTildeTag(signature.type.getText?.(), parsed);
    if (tilde !== null) {
      returns = tilde.typeRaw;
    } else if (parsed === '' && typeof signature.type.typeExpression.getText() === 'string') {
      returns = balancedBraceInner(signature.type.getText?.() ?? '')?.text ?? '';
    } else {
      returns = tilde?.typeRaw ?? parsed;
    }
  }
  return {params, returns};
}
export {tsOverloadTag};
