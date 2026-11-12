import {splitTemplateBindings} from './splitTemplateBindings.js';
import {readTemplateBinding} from './readTemplateBinding.js';
/**
 * Lowers one template node to shared schema rows, one per binding: tsc
 * splits `@template O, P` into two type parameters (each a binding, each
 * carrying the braced constraint), so one node yields one row per
 * comma-separated binding. The head splits into bindings first (a
 * bracketed `[K=Map<A, B>]` default keeps its inner comma), then each
 * binding reads as name plus `= default`.
 * @example
 * docTemplateNode({typeRaw: 'string', headRaw: 'K'});
 * // [{name: 'K', constraint: 'string', default: ''}]
 * @example
 * docTemplateNode({typeRaw: 'string', headRaw: '[K=string]'});
 * // [{name: 'K', constraint: 'string', default: 'string'}]
 * @example
 * docTemplateNode({typeRaw: '', headRaw: 'O, P The obj and props types'});
 * // [{name: 'O', constraint: '', default: ''}, {name: 'P', constraint: '', default: ''}]
 * @param {{typeRaw: string, headRaw: string}} node - Raw tag node.
 * @returns {{name: string, constraint: string, default: string}[]} Canonical templates.
 */
function docTemplateNode(node) {
  const rows = [];
  for (const binding of splitTemplateBindings(node.headRaw)) {
    const {name, default: def} = readTemplateBinding(binding);
    rows.push({name, constraint: node.typeRaw, default: def});
  }
  return rows;
}
export {docTemplateNode};
