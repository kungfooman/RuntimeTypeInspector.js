import {expandTypeDepFree} from "./expandTypeDepFree.mjs";
import {simplifyType} from "./simplifyType.mjs";
/**
 * @param {string} src - JSDoc comment of the setter.
 * @param {Function} expandType - The expandType function.
 * @returns {string | DocType | undefined} The parsed and possibly expanded type from
 * the JSDoc comment, or undefined if parsing fails to find `@type`.
 */
function parseJSDocSetter(src, expandType = expandTypeDepFree) {
  const regex = /@type \{(.*?)\}/g;
  const matches = [...src.matchAll(regex)];
  if (matches.length === 1) {
    const match = matches[0];
    const type = expandType(match[1]);
    const simplifiedType = simplifyType(type, /* optional */ false);
    return simplifiedType;
  }
}
export {parseJSDocSetter};
