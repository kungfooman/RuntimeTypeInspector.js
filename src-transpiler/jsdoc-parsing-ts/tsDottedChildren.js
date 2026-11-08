import {parseParamHead} from '../jsdoc-parsing-depfree/parseParamHead.js';

/**
 * Recovers dotted sub-param rows TS merges into their container. TS
 * never surfaces `options.maxRetries` as a tag: it absorbs trailing
 * rows as container type text. So TS owns discovery (which row is a
 * merged container), and this re-slices the raw source for the children:
 * each following `@param` whose head starts with `container + '.'`
 * contributes its head grammar and brace text.
 * @example
 * tsDottedChildren('options', '@param {object} options @param {number} [options.maxRetries]', 1);
 * // [{name: 'options.maxRetries', bracketed: true, type: 'number', dropped: false, merged: false}]
 * @param {string} container - Container name (e.g. `options`).
 * @param {string} src - Raw JSDoc comment text.
 * @param {number} fromLine - Comment line index after the container row.
 * @returns {import('../jsdoc-parsing-depfree/canonicalDoc.js').CanonicalParam[]} Child rows in order.
 */
function tsDottedChildren(container, src, fromLine) {
  const lines = src.split('\n');
  const children = [];
  for (const line of lines.slice(fromLine)) {
    const atParam = line.indexOf('@param');
    if (atParam === -1) {
      continue;
    }
    const after = line.slice(atParam + '@param'.length);
    const brace = after.match(/^\s*\{([^}]*)\}\s*(\S+)/);
    if (brace === null) {
      break;
    }
    const head = brace[2];
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
    children.push({name, bracketed: optional, type: brace[1], dropped: false, merged: false});
  }
  return children;
}
export {tsDottedChildren};
