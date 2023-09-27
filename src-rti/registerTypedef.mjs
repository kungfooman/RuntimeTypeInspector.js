/**
 * @type {Record<string, object>}
 */
const typedefs = {};
/**
 * @param {string} name - Name of typedef.
 * @param {Record<string, object>} typedef - The parsed typedef from source.
 */
function registerTypedef(name, typedef) {
  typedefs[name] = typedef;
}
export {typedefs, registerTypedef};
