/**
 * @todo
 *  - To prevent circularity, check that "search" isn't in "replace" in the first place?
 *  - add depth argument
 *  - add bunch of unit tests to test all possible cases
 *  - call it copyAndReplace?
 *  - if a subtype is a typedef and we change that without creating a copy, we invalidate that typedef... make a unit test
 *  - add intersection type replacements for instance: 'fixed' & Key
 * @param {*} type - The type.
 * @param {*} search - The search.
 * @param {*} replace - The replace.
 * @param {*} warn - The warn.
 * @returns {any} - In-place replaced version of the structured type.
 */
function replaceType(type, search, replace, warn) {
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
  } else if (type.type === 'tuple') {
    const {elements} = type;
    const {length  } = elements;
    for (let i = 0; i < length; i++) {
      const element = elements[i];
      elements[i] = replaceType(element, search, replace, warn);
    }
    return type;
  } else if (type.type === 'array') {
    type.elementType = replaceType(type.elementType, search, replace, warn);
    return type;
  } else if (type.type === 'union') {
    const {members} = type;
    const {length } = members;
    for (let i = 0; i < length; i++) {
      const member = members[i];
      members[i] = replaceType(member, search, replace, warn);
    }
    return type;
  }
  if (type.type) {
    warn('replaceType: unhandled', {type, search, replace});
  }
  return type;
}
export {replaceType};
