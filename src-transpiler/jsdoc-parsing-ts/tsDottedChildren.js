import {parseParamHead} from '../jsdoc-parsing-depfree/parseParamHead.js';
/**
 * Recovers dotted sub-param rows TS merges into their container. TS
 * never surfaces `options.maxRetries` as a tag: it absorbs trailing
 * rows as container type text. So TS owns discovery (which row is a
 * merged container), and this re-slices the raw source for the children:
 * each following `@param` whose head starts with `container + '.'`
 * contributes its head grammar and brace text. Tags scan per tag
 * segment, not per line, so mid-line children (container and child on
 * one line) recover too.
 * @example
 * tsDottedChildren('options', '@param {object} options @param {number} [options.maxRetries]', 1);
 * // [{name: 'options.maxRetries', bracketed: true, type: 'number', dropped: false, merged: false}]
 * @param {string} container - Container name (e.g. `options`).
 * @param {string} src - Raw JSDoc comment text.
 * @param {number} fromTag - Tag segment index after the container row.
 * @returns {import('../jsdoc-parsing-depfree/canonicalDoc.js').CanonicalParam[]} Child rows in order.
 */
function tsDottedChildren(container, src, fromTag) {
  const segments = src.split('@param');
  const children = [];
  for (const segment of segments.slice(fromTag)) {
    // Bracketed heads may carry spaces inside defaults (`=new
    // Object3D()`), so the bracket group reads whole before the bare
    // token fallback: the head grammar below validates either way.
    const brace = segment.match(/^\s*\{([^}]*)\}\s*(\[.*?\]|\S+)/);
    if (brace === null) {
      break;
    }
    const [, , head] = brace;
    // Bracketed children (`[options.x]`) lead with `[`; strip it for the
    // container match, the head grammar below recovers the flag.
    const bare = head.replace(/^\[/, '');
    if (bare.startsWith(container + '.') === false) {
      break;
    }
    // Heads reuse the single depfree grammar (`parseParamHead`): the
    // child name and bracket flag match the depfree reader by
    // construction instead of by a second scan.
    const {name, optional, valid} = parseParamHead(head);
    if (valid === false) {
      break;
    }
    children.push({
      name,
      bracketed: optional,
      type: brace[1],
      dropped: false,
      merged: false,
    });
  }
  return children;
}
export {tsDottedChildren};
