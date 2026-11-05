import {extractCurlyContent} from './extractCurlyContent.js';
import {extractNameAndOptionality} from './extractNameAndOptionality.js';
/** @import {ExpandedType} from './expandedType.js' */
/** @import {ExpandType} from './parseJSDoc.js' */
/**
 * @typedef {object} ParamTag
 * @property {string} typeRaw - The raw text inside the braces.
 * @property {string} nameRaw - The head token text after the braces
 * (bracketed name with defaults, no trailing description).
 * @property {boolean} invalidRest - Whether the rest marker sits before the
 * name instead of inside the braces (`{number[]} ...values`).
 * @property {boolean} optional - Whether the name is bracketed (`[name]`).
 * @property {string} name - The parameter name with brackets and defaults stripped.
 */
/**
 * Scans one JSDoc section into raw `@param` tags without expanding types.
 * The scanner keeps each tag's brace text and name text separate, so rest
 * markers survive even though the type expander erases them (`...number`
 * becomes a plain array downstream). Each match must start on its own tag
 * line: a `@param` that only appears mid-line text is prose, not a tag.
 * Descriptions may trail a name on the same line; only the head token is
 * kept.
 * @example
 * parseJSDocTags('* @param {...number[]} values ok');
 * // [{typeRaw: '...number[]', nameRaw: 'values ok', invalidRest: false,
 * //   optional: false, name: 'values'}]
 * @param {string} section - One overload or implementation doc section.
 * @returns {ParamTag[]} Raw tags in source order.
 */
function parseJSDocTags(section) {
  /** @type {ParamTag[]} */
  const tags = [];
  const lines = section.split('\n');
  for (const line of lines) {
    const at = line.indexOf('@param');
    if (at === -1) {
      continue;
    }
    const gap = line.slice(0, at);
    const trimmed = gap.trim();
    if (trimmed.includes('@')) {
      continue;
    }
    if (trimmed !== '' && trimmed !== '*' && trimmed !== '/**') {
      continue;
    }
    const from = line.slice(at);
    if (!from.startsWith('@param ')) {
      continue;
    }
    const {content: typeRaw, nextIndex} = extractCurlyContent(from);
    const after = from.slice(nextIndex).trim();
    const cut = after.search(/@\w|\*\//);
    const head = (cut === -1 ? after : after.slice(0, cut)).trim();
    const [name, optional] = extractNameAndOptionality(head);
    const nameRaw = head;
    const invalidRest = nameRaw.trimStart().startsWith('...');
    tags.push({typeRaw, nameRaw, invalidRest, optional, name});
  }
  return tags;
}
export {parseJSDocTags};
