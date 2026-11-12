import {stripTsBraces      } from './stripTsBraces.js';
import {docTemplateNode    } from '../jsdoc-parsing-depfree/docTemplateNode.js';
import {readTemplateBinding} from '../jsdoc-parsing-depfree/readTemplateBinding.js';
import {recoverTildeTag    } from './recoverTildeTag.js';
/**
 * Reads one TS `@template` tag to shared schema rows, one per binding:
 * tsc splits `@template O, P` into two type parameters (each carrying the
 * braced constraint), so one tag yields one row per binding. A bare
 * binding reads whole, a bracketed `[K]`, `[K=V]`, or `[K = V]` binding
 * splits name from default, the same as the depfree row builder.
 * @example
 * tsTemplateTag({typeParameters: [{getText: () => '[K=string]'}], constraint: {getText: () => '{string}'}});
 * // [{name: 'K', constraint: 'string', default: 'string'}]
 * @param {object} tag - TS JSDoc template tag.
 * @returns {{name: string, constraint: string, default: string}[]} Canonical templates.
 */
function tsTemplateTag(tag) {
  const rawConstraint = tag.constraint ? stripTsBraces(tag.constraint.getText()) : '';
  const tilde = tag.constraint ? recoverTildeTag(tag.getText?.(), rawConstraint) : null;
  if (tilde !== null && (tag.typeParameters ?? []).length === 0) {
    // tsc drops the binding along with a tilde constraint, so the head
    // after the constraint reads the depfree way: same builder, same rows.
    return docTemplateNode({typeRaw: tilde.typeRaw, headRaw: tilde.headRaw});
  }
  const constraint = tilde !== null ? tilde.typeRaw : rawConstraint;
  const rows = [];
  for (const param of tag.typeParameters ?? []) {
    const {name, default: def} = readTemplateBinding(param.getText());
    rows.push({name, constraint, default: def});
  }
  return rows;
}
export {tsTemplateTag};
