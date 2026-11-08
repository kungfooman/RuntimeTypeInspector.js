import {stripTsBraces} from './stripTsBraces.js';

/**
 * Reads one TS `@template` tag to the shared schema row: binding name
 * from `typeParameters`, plus the braced constraint and `= default`
 * split out of the binding text.
 * @example
 * tsTemplateTag({typeParameters: [{getText: () => '[K=string]'}], constraint: {getText: () => '{string}'}});
 * // {name: 'K', constraint: 'string', default: 'string'}
 * @param {object} tag - TS JSDoc template tag.
 * @returns {{name: string, constraint: string, default: string}} Canonical template.
 */
function tsTemplateTag(tag) {
  const binding = (tag.typeParameters ?? [])[0]?.getText() ?? '';
  const constraint = tag.constraint ? stripTsBraces(tag.constraint.getText()) : '';
  const match = binding.match(/^\[([A-Za-z_$][\w$]*)(?:=(.*))?\]$/);
  if (match) {
    return {name: match[1], constraint, default: (match[2] ?? '').trim()};
  }
  return {name: binding, constraint, default: ''};
}
export {tsTemplateTag};
