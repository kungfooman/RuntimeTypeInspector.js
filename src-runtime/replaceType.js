/**
 * @todo
 *  - To prevent circularity, check that "search" isn't in "replace" in the first place?
 *  - add depth argument
 *  - add bunch of unit tests to test all possible cases
 *  - call it copyAndReplace?
 *  - if a subtype is a typedef and we change that without creating a copy, we invalidate that typedef... make a unit test
 * @param {*} type - The type.
 * @param {*} search - The search.
 * @param {*} replace - The replace.
 * @param {*} warn - The warn.
 * @returns {any} - A copy of the structured type.
 */
function replaceType(type, search, replace, warn) {
  //if (typeof type )
  if (type === search) {
    // console.log("replaceType", {type, search, replace, warn});
    return replace;
  }
  if (type.type === 'object') {
    const {properties} = type;
    // todo I need unit tests making sure I don't need a full copy
    // const newProperties = {};
    for (const prop in properties) {
      const val = properties[prop];
      properties[prop] = replaceType(val, search, replace, warn);
    }
    return type;
  } else if (type.type === "tuple") {
    const {elements} = type;
    const n = elements.length;
    for (let i = 0; i < n; i++) {
      const val = elements[i];
      const replacedVal = replaceType(val, search, replace, warn);
      elements[i] = replacedVal;
      //if ()
    }
    return type;
  }
  warn('replaceType: unhandled', {type, search, replace});
}
export {replaceType};
