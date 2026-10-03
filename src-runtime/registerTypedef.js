/**
 * @type {Record<string, string|object>}
 */
const typedefs = {};
/**
 * Template parameter names per generic typedef, e.g. `['T']` for
 * `@template T @typedef {...} Box`. Lets generic references like
 * `Box<number>` instantiate by substituting arguments for parameters.
 * @type {Record<string, string[]>}
 */
const typedefTemplates = {};
/**
 * Mutation counter for the typedef registries: bumped on every actual
 * registration so resolution caches (class shapes, mapping
 * instantiations) can tell cached results from stale ones with one
 * integer compare instead of re-deriving.
 * @type {number}
 */
let typedefVersion = 0;
/**
 * @param {string} name - Name of typedef.
 * @param {string|object} typedef - The parsed typedef from source.
 * @param {string[]} [templateParams] - Template parameter names for generic typedefs.
 */
function registerTypedef(name, typedef, templateParams) {
  // If it already exists as object but now it's a string
  if (typeof typedefs[name] === 'object' && typeof typedef === 'string') {
    // console.log("registerTypedef> ignore", name, typedef);
    return;
  }
  typedefs[name] = typedef;
  if (Array.isArray(templateParams) && templateParams.length) {
    typedefTemplates[name] = [...templateParams];
  }
  typedefVersion++;
}
/**
 * Bumps the version for out-of-band registry mutations (test resets that
 * delete keys directly instead of registering).
 */
function bumpTypedefVersion() {
  typedefVersion++;
}
export {typedefs, typedefTemplates, registerTypedef, typedefVersion, bumpTypedefVersion};
