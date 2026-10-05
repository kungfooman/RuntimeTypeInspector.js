/**
 * The global message bus for RTI cross-context traffic: `window` in pages,
 * `self` in workers, nothing in bare Node. Property access on `globalThis`
 * never throws for missing globals (unlike a bare `self` reference), so
 * importing the runtime — including inside the transpiler bundle the engine
 * loads in Node — stays safe where no message host exists.
 * @returns {object|undefined} A host carrying `addEventListener`, if any.
 * @example globalMessageHost() // window, self, or undefined in bare Node
 */
export function globalMessageHost() {
  return globalThis.window ?? globalThis.self ?? undefined;
}
