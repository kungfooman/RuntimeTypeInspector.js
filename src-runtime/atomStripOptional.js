/**
 * Strips the `optional` flag from a tagged annotated atom
 * (`{type: 'atom', atomType, ...}`), returning a fresh wrapper with
 * `optional: false`. Non-atom inputs pass through untouched, so callers can
 * feed the loop variable straight in without probing the tag themselves.
 *
 * Why strip instead of unwrap: in the `resolveObjectArgs` utility loop in
 * `validateReference.js`, the transparent wrappers `NonNullable`, `Readonly`
 * and `NoInfer` re-enter the loop with their single argument and let the
 * next iteration dispatch on it. An unwrapped atom payload (a bare `'Camera'`
 * string or a `{type: 'Camera'}` leaf) is not an object shape, so the loop
 * below would fall through and report the reference as unresolvable. Keeping
 * the wrapper and only clearing the flag preserves the loop shape the other
 * branches rely on: the next iteration still sees a tagged node and chases
 * the payload through the typedef, class or constructor branches exactly
 * like an unflagged atom would. `false` and absent are equivalent here:
 * `canonicalize.js` normalizes `false` flags to absent, and validation reads
 * plain truthiness, so the stored `false` is self-documenting without
 * changing any downstream verdict.
 * @param {*} type - The type to strip, usually the unwrapped utility argument.
 * @returns {*} The same atom with `optional: false`, or the input unchanged.
 * @example
 * atomStripOptional({type: 'atom', atomType: 'Camera', optional: true});
 * // {type: 'atom', atomType: 'Camera', optional: false}
 */
function atomStripOptional(type) {
  if (type && typeof type === 'object' && type.type === 'atom') {
    return {...type, optional: false};
  }
  return type;
}
export {atomStripOptional};
