import {classes, classVersion} from "./registerClass.js";
import {versionedCache} from "./memoize.js";
// Reverse class registry (constructor to name): the linear scan it replaces
// ran per chain link of every class-shape derivation. Rebuilt when the
// class registry mutates (re-registration changes what a name resolves
// to); the dropped map takes dead constructors with it instead of leaking.
const namesByCtor = versionedCache(() => classVersion);
/**
 * Finds the registered name of a constructor (identity, not `.name`, so
 * aliases and minification stay correct).
 * @param {Function} ctor - Constructor to look up.
 * @returns {string|undefined} Registered name or undefined.
 * @example
 * registeredNameOf(Array); // 'Array' only when registered, else the fallback
 */
function registeredNameOf(ctor) {
  if (ctor === null || (typeof ctor !== 'object' && typeof ctor !== 'function')) {
    return ctor?.name;
  }
  if (namesByCtor.has(ctor)) {
    return namesByCtor.get(ctor);
  }
  for (const name in classes) {
    if (classes[name] === ctor) {
      namesByCtor.set(ctor, name);
      return name;
    }
  }
  const fallback = ctor?.name;
  namesByCtor.set(ctor, fallback);
  return fallback;
}
export {registeredNameOf};
