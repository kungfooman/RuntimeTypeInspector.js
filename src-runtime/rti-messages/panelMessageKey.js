/**
 * Keys one panel row per reporting runtime: two registries can hold
 * different shapes behind the same bare `loc-name` (worker, iframe,
 * or a version mix on one page), and merging them would attribute one
 * registry's failures to the other's types. Same runtime traffic keeps
 * the bare key, so the single registry page renders exactly like before.
 * @param {string} eventKey - Bare `loc-name` the checking side computed.
 * @param {*} source - Source id stamped on the message, if any.
 * @param {string} runtimeId - Identity of this runtime evaluation.
 * @returns {string} Panel key, suffixed for foreign registries.
 * @example panelMessageKey('takeFloat-data', undefined, 'abc') // 'takeFloat-data'
 */
function panelMessageKey(eventKey, source, runtimeId) {
  if (source === undefined || source === runtimeId) {
    return eventKey;
  }
  return `${eventKey}@${source}`;
}
export {panelMessageKey};
