/**
 * Unwraps a tagged annotated atom (`{type: 'atom', atomType, ...}`) into the
 * shape validation reads: the inner node when it is an object, a bare
 * `{type: inner}` leaf otherwise, with the occurrence flags merged over the
 * inner flags. A tree replacement keeps its own shape (plus the occurrence
 * flags), so the inner node must flow into validation, never the wrapper.
 *
 * Why the wrapper exists at all: before every `ExpandedType` member carried
 * a literal `type` tag, an annotated atom was `{type: T, optional}` with the
 * payload sitting directly in `type`. Tagging gave atoms the literal
 * `'atom'` discriminant, which stole the `type` key the loop and the
 * validators dispatch on, so the payload moved to `atomType` and every
 * consumer must unwrap before switching on the shape.
 * @param {object} expect - The annotated atom node.
 * @returns {object} Unwrapped shape with merged flags.
 * @example
 * atomUnwrap({type: 'atom', atomType: 'K', optional: true});
 * // {type: 'K', optional: true}
 */
function atomUnwrap(expect) {
  const inner = expect.atomType;
  const innerIsObject = inner !== null && typeof inner === 'object' && !Array.isArray(inner);
  const base = innerIsObject ? inner : {type: inner};
  const out = {...base};
  if (expect.optional || (innerIsObject && inner.optional)) {
    out.optional = true;
  }
  if (expect.readonly !== undefined) {
    out.readonly = expect.readonly;
  } else if (innerIsObject && inner.readonly !== undefined) {
    out.readonly = inner.readonly;
  }
  return out;
}
export {atomUnwrap};
