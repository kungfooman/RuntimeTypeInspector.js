import {requiredTypeofs    } from './expandType.js';
/**
 * Pre-marks every `typeof Name` value query inside a JSDoc comment so the
 * later `VariableDeclaration` pass emits its `registerVariable` in source
 * order (before any runtime use). Previously only `@typedef` comments were
 * pre-scanned, so a direct `@param {typeof X}` never registered `X` and
 * every such check failed closed. Marks without a same-named declaration
 * never emit anything and are harmless.
 * @param {string} text - The comment text.
 * @example
 * markTypeofRequirements('@param {typeof MOTION_FREE} m'); // marks MOTION_FREE missing
 */
function markTypeofRequirements(text) {
  for (const match of text.matchAll(/\btypeof\s+([A-Za-z_$][\w$]*)/g)) {
    if (!requiredTypeofs[match[1]]) {
      requiredTypeofs[match[1]] = 'missing';
    }
  }
}
export {markTypeofRequirements};
