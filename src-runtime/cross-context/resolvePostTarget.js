/**
 * Resolves the post target for cross context traffic: the embedding
 * parent when RTI runs framed, otherwise the current scope itself.
 * Property access on `globalThis` never throws for missing globals,
 * unlike a bare `self` reference, so importing this in bare Node
 * stays safe.
 * @returns {*} The bus carrying `postMessage`, or undefined with no bus.
 * @example resolvePostTarget() // parent, self, or undefined in bare Node
 */
function resolvePostTarget() {
  return globalThis.parent ?? globalThis.self ?? undefined;
}
export {resolvePostTarget};
