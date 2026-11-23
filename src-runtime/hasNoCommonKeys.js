/**
 * Weak-type gate mirroring `tsc --strict` TS2559: a value shares no key
 * with an all-optional (weak) shape, so nothing about it can satisfy the
 * type. Freshness never exempts this: `tsc` rejects the same probe at a
 * stale call site too (verified `--strict`, JSDoc and TS). The empty value
 * passes (assignable to every weak type), and shapes with required keys
 * stay on their own paths. Index signatures opt out: a signature-covered
 * key is never excess, so a `{[n: number]: string, length?: number}`
 * shape keeps validating `{0: 'hi'}` structurally instead of tripping
 * the gate on the missing `length`.
 * @param {*} value - The actual value that we need to validate.
 * @param {*} expect - Object shape with `properties`.
 * @returns {boolean} True when the value has no key in common (weak fail).
 * @example
 * hasNoCommonKeys({b: 's'}, {type: 'object', properties: {a: {type: 'number', optional: true}}});
 * // true
 * // Shared keys pass the gate (the leaf types still decide):
 * hasNoCommonKeys({a: 1}, {type: 'object', properties: {a: {type: 'number', optional: true}}});
 * // false
 */
function hasNoCommonKeys(value, expect) {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const valueKeys = Object.keys(value);
  if (valueKeys.length === 0) {
    return false;
  }
  const properties = expect && typeof expect === 'object' ? expect.properties : undefined;
  if (!properties || typeof properties !== 'object') {
    return false;
  }
  const knownKeys = Object.keys(properties);
  if (knownKeys.length === 0) {
    return false;
  }
  for (const key of knownKeys) {
    const prop = properties[key];
    if (!(prop && typeof prop === 'object' && prop.optional)) {
      return false;
    }
  }
  if (Array.isArray(expect.indexSignatures) && expect.indexSignatures.length > 0) {
    return false;
  }
  for (const key of valueKeys) {
    if (Object.hasOwn(properties, key)) {
      return false;
    }
  }
  return true;
}
export {hasNoCommonKeys};
