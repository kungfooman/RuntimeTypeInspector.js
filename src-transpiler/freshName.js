/**
 * Names a fresh collision-free identifier by scanning serialized source.
 * @param {string} source - Serialized source to scan for collisions.
 * @param {string} base - Preferred identifier base.
 * @returns {string} Collision-free identifier.
 * @example
 * freshName('{"name":"rtiArgs"}', 'rtiArgs'); // 'rtiArgs_'
 */
function freshName(source, base) {
  let name = base;
  while (source.includes('"name":"' + name + '"')) name += '_';
  return name;
}
export {freshName};
