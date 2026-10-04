/**
 * Flattens a pinned template type to its member list: plain literals yield a
 * single member, widened unions yield theirs.
 * @param {*} type - Pinned literal or literal union.
 * @returns {*[]} Flat member list.
 * @example
 * unionMembers({type: 'union', members: ['"a"', '"b"']});
 * // ['"a"', '"b"']
 */
function unionMembers(type) {
  if (type && typeof type === 'object' && type.type === 'union' && Array.isArray(type.members)) {
    return [...type.members];
  }
  return [type];
}
export {unionMembers};
