import {parseParamHead} from "./parseParamHead.js";

/**
 * Builds one raw param node from brace and head text. The head reads
 * through the shared grammar (`parseParamHead`): the head keeps only its
 * first token (bracketed defaults, trailing prose fall away) and a
 * leading `...` flags the misplaced-rest spelling, which callers drop.
 * A head the grammar rejects (e.g. `*value` from stray furniture) yields
 * an empty name: the tag binds to nothing, matching tsc which reads it as
 * empty.
 * @example
 * makeParamTag('number[]', '...values');
 * // {typeRaw: 'number[]', nameRaw: '...values', invalidRest: true,
 * //  optional: false, name: '...values'}
 * @example
 * makeParamTag('number', '*value');
 * // {typeRaw: 'number', nameRaw: '*value', invalidRest: false,
 * //  optional: false, name: ''}
 * @param {string} typeRaw - The raw text inside the braces.
 * @param {string} headRaw - The text after the braces.
 * @returns {import('./parseJSDoc.js').ParamTag} Raw param node flags.
 */
function makeParamTag(typeRaw, headRaw) {
  const {name, optional, segments, valid} = parseParamHead(headRaw);
  const nameRaw = headRaw;
  const invalidRest = nameRaw.trimStart().startsWith('...');
  // The `...` marker rides through the path scan untouched (valid by
  // construction); real paths carry their segments for the fold.
  if (valid === true && segments.length > 0) {
    return {typeRaw, nameRaw, invalidRest, optional, name, segments};
  }
  return {typeRaw, nameRaw, invalidRest, optional, name};
}
export {makeParamTag};
