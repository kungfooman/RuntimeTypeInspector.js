/** @type {Record<string, Function>} */
const classes = {};
/** Reverse map: constructor identity -> canonical (pre-minify) name. */
const classNames = new Map();
/**
 * Mutation counter for the class registry (see `typedefVersion`): lets
 * resolution caches invalidate on re-registration with one compare.
 * @type {number}
 */
let classVersion = 0;
/**
 * Registers a class constructor. The optional canonical name is the
 * spelling from before bundling/minification (`registerClassAs("Vec",
 * e)`): identity is keyed by the live constructor, so checks survive
 * any renaming. Without it the runtime constructor name is used, as
 * before.
 * @param {Function} theClass - The class.
 * @param {string} [canonicalName] - Pre-bundle spelling.
 */
function registerClass(theClass, canonicalName) {
  const name = typeof canonicalName === 'string' && canonicalName ?
    canonicalName :
    theClass.name;
  classes[name] = theClass;
  classNames.set(theClass, name);
  classVersion++;
}
/**
 * Canonical (pre-bundle) name of a registered constructor, by identity.
 * Falls back to the runtime name so unregistered constructors keep
 * today's behavior.
 * @param {Function} ctor - Constructor to look up.
 * @returns {string|undefined} Registered name or runtime name.
 */
function canonicalNameOf(ctor) {
  if (typeof ctor !== 'function') {
    return undefined;
  }
  const known = classNames.get(ctor);
  if (typeof known === 'string') {
    return known;
  }
  return ctor.name;
}
/**
 * Bumps the version for out-of-band registry mutations (test resets that
 * delete keys directly instead of registering).
 */
function bumpClassVersion() {
  classVersion++;
}
export {classes, classNames, registerClass, canonicalNameOf, classVersion, bumpClassVersion};
