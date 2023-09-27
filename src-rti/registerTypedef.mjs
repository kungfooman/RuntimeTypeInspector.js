/**
 * @type {Record<string, object>}
 */
const typedefs = {};
/**
 * @param {string} name - Name of typedef.
 * @param {Record<string, object>} typedefs_ - The parsed typedef from source.
 */
function registerTypedef(name, typedef) {
  typedef[name] = typedef;
}
export {typedefs, registerTypedef};
