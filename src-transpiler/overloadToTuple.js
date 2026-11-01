import {parseJSDoc} from './parseJSDoc.js';
import {expandTypeDepFree} from './expandTypeDepFree.js';

/**
 * Converts an overload's positional parameter documentation into a tuple.
 * TypeScript treats an overload rest annotation as variadic only when its
 * annotated type after the dots is itself an array.
 * @param {string} section - One overload section.
 * @param {import('./parseJSDoc.js').ExpandType} [expandType] - Type parser.
 * @param {Set<string>} [ignored] - Parameter names suppressed by the host.
 * @returns {*} Tuple type.
 * @example
 * overloadToTuple('@param {number} x');
 * // {type: 'tuple', elements: [{type: 'tupleMember', name: 'x', elementType: 'number'}]}
 */
function overloadToTuple(section, expandType = expandTypeDepFree, ignored = new Set()) {
  const params = parseJSDoc(section, expandType) || {};
  const restNames = new Set();
  for (const match of section.matchAll(/@param\s+\{\s*\.\.\.[^}]*\}\s+(\w+)/g)) {
    restNames.add(match[1]);
  }
  const elements = Object.entries(params).map(([name, type]) => {
    const optional = typeof type === 'object' && type !== null && type.optional === true;
    let elementType = type;
    if (optional) elementType = {...type, optional: false};
    let rest = false;
    if (restNames.has(name) && type && typeof type === 'object' && type.type === 'array') {
      elementType = type.elementType;
      rest = typeof elementType === 'object' && elementType !== null && elementType.type === 'array';
    }
    if (ignored.has(name)) elementType = rest ? {type: 'array', elementType: 'any'} : 'any';
    const member = {type: 'tupleMember', name, elementType};
    if (optional) member.optional = true;
    if (rest) member.dotDot = true;
    return member;
  });
  return {type: 'tuple', elements};
}
export {overloadToTuple};
