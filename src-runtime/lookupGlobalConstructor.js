import {validators} from "./validators.js";
/**
 * Looks up a constructor by name beyond the class registry: engine builds
 * keep platform constructors (e.g. `Float32Array`) unregistered, but they
 * still hang off `globalThis`/`window`.
 * @param {string} name - The constructor name.
 * @returns {Function|undefined} The constructor, or undefined.
 */
function lookupGlobalConstructor(name) {
  try {
    const direct = globalThis[name];
    if (typeof direct === 'function') {
      return direct;
    }
  } catch {
    // Cross-realm lookups can throw; fall through to window.
  }
  try {
    if (typeof window !== 'undefined') {
      const viaWindow = window[name];
      if (typeof viaWindow === 'function') {
        return viaWindow;
      }
      if (typeof name === 'string' && name.startsWith('globalThis.')) {
        const inner = window[name.slice(11)];
        if (typeof inner === 'function') {
          return inner;
        }
      }
    }
  } catch {
    // Storage access can throw; unresolvable either way.
  }
  return undefined;
}
// Self-registered like the other runtime helpers (`evaluateCondition`,
// `decideIfEquals`): readable through `validators` so userland overrides
// take effect without a release. `validateType.js` imports this module for
// its side effect, so the entry exists wherever validation runs.
validators.lookupGlobalConstructor = lookupGlobalConstructor;
export {lookupGlobalConstructor};
