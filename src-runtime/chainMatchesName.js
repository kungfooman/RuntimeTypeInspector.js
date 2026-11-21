import {stripBundlerSuffix} from "./stripBundlerSuffix.js";
/**
 * Whether any prototype in `value`'s chain was built by a constructor
 * named `name`: same-realm `instanceof` fails across realms (each realm
 * owns its constructors), but the chain itself survives `vm` and
 * worker boundaries, so a foreign `class MyArr extends Array` still
 * shows `Array` one level up. Failed reads (revoked proxies, throwing
 * getters) fail closed. Depth is bounded: real chains are short, and a
 * cyclic prototype (only settable via `__proto__` tampering) must not
 * hang validation. Bundler-renamed links (`Equation$6`) match their
 * JSDoc spelling (`Equation`), since Rollup appends `$<digits>` when
 * several modules declare the same local name.
 * @param {*} value - The value whose chain to walk.
 * @param {string} name - The constructor name to look for.
 * @returns {boolean} True when some chain link names `name`.
 * @example
 * chainMatchesName([1, 2], 'Array'); // true
 * chainMatchesName({}, 'Array'); // false
 */
function chainMatchesName(value, name) {
  if ((value === null || value === undefined) || typeof name !== 'string') {
    return false;
  }
  try {
    let proto = Object.getPrototypeOf(value);
    for (let i = 0; i < 32 && proto !== null; i++) {
      let ctor;
      try {
        ctor = proto.constructor;
      } catch {
        return false;
      }
      const plain = typeof ctor === 'function' && ctor.name === name;
      const renamed = typeof ctor === 'function' && stripBundlerSuffix(ctor.name) === name;
      if (plain || renamed) {
        return true;
      }
      proto = Object.getPrototypeOf(proto);
    }
  } catch {
    return false;
  }
  return false;
}
export {chainMatchesName};
