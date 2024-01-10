/**
 * @todo
 *  - To prevent circularity, check that "search" isn't in "replace" in the first place?
 *  - add depth argument
 *  - add bunch of unit tests to test all possible cases
 * @param {*} type - The type.
 * @param {*} search - The search.
 * @param {*} replace - The replace.
 * @param {*} warn - The warn.
 */
function replaceType(type, search, replace, warn) {
  if (type.type === 'object') {
    const {properties} = type;
    for (const prop in properties) {
      const val = properties[prop];
      if (val === search) {
        // console.log("replaceType", {prop, properties, search, replace});
        properties[prop] = replace;
      }
    }
    return;
  }
  warn('replaceType: unhandled', {type, search, replace});
}
export {replaceType};
