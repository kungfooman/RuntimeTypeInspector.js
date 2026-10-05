/**
 * Finds the index signature covering a value key: `string` parameters match
 * every key, `number` parameters match canonical numeric names only (the
 * round trip holds: `'-1'` and `'1.5'` count, `'0x10'` and `''` do not,
 * mirroring TypeScript). Unknown parameter shapes never match, keeping
 * them on today's excess path.
 * @param {object} expect - Object shape possibly carrying `indexSignatures`.
 * @param {string} key - Value key to cover.
 * @returns {object|undefined} Matching signature or undefined.
 * @example
 * matchIndexSignature({type: 'object', indexSignatures: [{type: 'indexSignature', indexType: 'number', indexParameters: [{type: 'string', name: 'k'}]}]}, 'a');
 * // {type: 'indexSignature', indexType: 'number', indexParameters: [{type: 'string', name: 'k'}]}
 */
function matchIndexSignature(expect, key) {
  const signatures = expect && Array.isArray(expect.indexSignatures) ? expect.indexSignatures : [];
  let stringFallback;
  for (const signature of signatures) {
    if (!signature || signature.type !== 'indexSignature') {
      continue;
    }
    const params = Array.isArray(signature.indexParameters) ? signature.indexParameters : [];
    const kind = params.length ? params[0].type : undefined;
    if (kind === 'number') {
      if (typeof key === 'string' && key !== '' && String(Number(key)) === key) {
        return signature;
      }
      continue;
    }
    if (kind === 'string') {
      stringFallback = stringFallback ?? signature;
    }
  }
  return stringFallback;
}
export {matchIndexSignature};
