/**
 * @type {Record<string, string>}
 */
const jsdocCache = {};
/**
 * @todo
 * update jsdoc cache if it changes or keep all possible version to generate maybe multiple function signatures
 * @example
 * pc.makeJSDoc('VignetteEffect#render', ["inputTarget", "outputTarget", "rect"], [inputTarget, outputTarget, rect])
 * @param {string} loc - The location.
 * @param {string[]} names - The names
 * @param {any[]} values - The values
 */
function makeJSDoc(loc, names, values) {
  const n = names.length;
  let jsdoc = '    /**\n';
  for (var i = 0; i < n; i++) {
    const name = names[i];
    const value = values[i];
    /** @type {string} */
    let type = typeof value;
    if (value === null) {
      type = 'null';
    } else if (value instanceof Object) {
      type = value.constructor.name;
    }
    if (type !== 'string' && pc[type]) {
      type = 'pc.' + type;
    }
    //debugger;
    jsdoc += `     * @param {${type}} ${name} - todo/jsdoc\n`
  }
  jsdoc += '     */';
  if (!jsdocCache[loc]) {
    jsdocCache[loc] = jsdoc;
    console.log(loc);
    console.log(jsdoc);
  }
}
export {jsdocCache, makeJSDoc};
