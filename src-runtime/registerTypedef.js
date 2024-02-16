/**
 * @type {Record<string, string|object>}
 */
const typedefs = {};
/**
 * @param {string} name - Name of typedef.
 * @param {string|object} typedef - The parsed typedef from source.
 */
function registerTypedef(name, typedef) {
  // If it already exists as object but now it's a string
  if (typeof typedefs[name] === 'object' && typeof typedef === 'string') {
    // console.log("registerTypedef> ignore", name, typedef);
    return;
  }
  typedefs[name] = typedef;
}
export {typedefs, registerTypedef};
