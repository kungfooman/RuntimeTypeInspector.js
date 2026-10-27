/**
 * Strips the `optional` flag from a tagged annotated atom
 * (`{type: 'atom', atomType, ...}`), returning a fresh wrapper with
 * `optional: false`. Non-atom inputs pass through untouched, so callers can
 * feed the loop variable straight in without probing the tag themselves.
 * `false` and absent are equivalent: `canonicalize.js` normalizes `false`
 * flags to absent, and validation reads plain truthiness, so the stored
 * `false` is self-documenting without changing any downstream verdict.
 * @param {*} type - The type to strip, usually the unwrapped utility argument.
 * @returns {*} The same atom with `optional: false`, or the input unchanged.
 * @example
 * // input: {type: 'atom', atomType: 'Camera', optional: true}
 * atomStripOptional(expandType('{camera?: Camera}').properties.camera);
 * // {type: 'atom', atomType: 'Camera', optional: false}
 */
function atomStripOptional(type) {
  if (type && typeof type === 'object' && type.type === 'atom') {
    return {...type, optional: false};
  }
  return type;
}
export {atomStripOptional};
