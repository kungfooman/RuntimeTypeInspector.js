/**
 * Whether `name` resolves to a constructor on the real global scope:
 * `globalThis` everywhere, plus the `window` extras the validator below
 * consults for browser-only constructors. Reads the environment directly,
 * never the overridable `lookupGlobalConstructor` table entry, so the
 * chain-walk gate below cannot reopen a name the consumer blinded on
 * purpose (blinding still fails closed). User-land names (`Equation`)
 * never resolve here and keep flowing to the prototype-chain walk.
 * @param {string} name - The expected type name.
 * @returns {boolean} True when the environment itself provides the name.
 * @example
 * globallyVisible('Float32Array'); // true
 * globallyVisible('Equation'); // false
 */
function globallyVisible(name) {
  if (typeof name !== 'string') {
    return false;
  }
  try {
    if (typeof globalThis !== 'undefined' && typeof globalThis[name] === 'function') {
      return true;
    }
  } catch {
    return false;
  }
  try {
    if (typeof window !== 'undefined') {
      if (typeof window[name] === 'function') {
        return true;
      }
      if (name.startsWith('globalThis.')) {
        const inner = name.slice(11);
        if (typeof window[inner] === 'function') {
          return true;
        }
      }
    }
  } catch {
    return false;
  }
  return false;
}
export {globallyVisible};
