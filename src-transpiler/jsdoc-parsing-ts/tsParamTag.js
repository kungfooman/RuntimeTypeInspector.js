import {stripTsBraces} from './stripTsBraces.js';
import {makeParamTag} from '../jsdoc-parsing-depfree/makeParamTag.js';
import {docParamTag} from '../jsdoc-parsing-depfree/docParamTag.js';
import {recoverTildeTag} from './recoverTildeTag.js';

/**
 * Reads one TS parameter (flat tag or inside a signature) to the shared
 * schema row. `dropped` means "binds nothing here", decided from tsc's
 * own evidence: a leading-`...` name is the TS1003/TS8032 rejection, and
 * an empty name (stray furniture like `*value`) matches no parameter.
 * Both agree with the depfree invalidRest/empty-name decline. A type tsc
 * truncated at jsdoc `~` recovers through the depfree builders, so the row
 * matches the depfree read exactly instead of parroting the truncation.
 * @example
 * tsParamTag({name: {getText: () => 'x'}, isBracketed: false, typeExpression: {getText: () => '{number}'}});
 * // {name: 'x', bracketed: false, type: 'number', dropped: false, merged: false}
 * @param {object} tag - TS JSDoc parameter tag or signature parameter.
 * @returns {import('../jsdoc-parsing-depfree/canonicalDoc.js').CanonicalParam} Canonical parameter.
 */
function tsParamTag(tag) {
  const raw = tag.name ? tag.name.getText() : '';
  const name = raw.split(/\s+/)[0].split('=')[0] ?? '';
  const type = tag.typeExpression ? stripTsBraces(tag.typeExpression.getText()) : '';
  const tilde = recoverTildeTag(tag.getText?.(), type);
  if (tilde !== null) {
    return docParamTag(makeParamTag(tilde.typeRaw, tilde.headRaw), tilde.typeRaw);
  }
  return {
    name,
    bracketed: tag.isBracketed === true,
    type,
    dropped: name === '' || name.startsWith('...'),
    // Set by the caller when the container absorbed trailing rows as type
    // text (the dotted-sub-param signal), never by the tag itself.
    merged: false,
  };
}
export {tsParamTag};
