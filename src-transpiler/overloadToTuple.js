import {parseJSDocDocument} from './jsdoc-parsing-depfree/parseJSDocDocument.js';
import {tagRestElementType} from './jsdoc-parsing-depfree/tagRestElementType.js';
import {isArrayNode} from './isArrayNode.js';
import {isExpandedObject} from './isExpandedObject.js';
import {expandTypeDepFree} from './expandTypeDepFree.js';
/**
 * Converts an overload's positional parameter documentation into a tuple.
 * Rest detection reads the raw tag (`...` inside the braces) because the
 * type expander erases the marker (`...number` becomes a plain array).
 * The written element shape decides: `...T[]` turns variadic over the
 * array's element type, while `...T` turns variadic over the gathered
 * element itself, matching tsc's accept/reject matrix (bare `...T`
 * accepts calls tsc accepts; `{...number}`-style unions now split the
 * gathered element at top-level `|`, `,`, `;`, `?` like tsc). An optional
 * rest tag (`[... ]`) is the TS2370 error: the member becomes `never` so
 * every call warns. A tag whose rest marker sits before the name
 * (`{number[]} ...values`) is the TS1003/TS8032 error and is dropped,
 * matching tsc's rejection of the spelling.
 * @param {string} section - One overload section.
 * @param {import('./parseJSDoc.js').ExpandType} [expandType] - Type parser.
 * @param {Set<string>} [ignored] - Parameter names suppressed by the host.
 * @returns {*} Tuple type.
 * @example
 * overloadToTuple('@param {number} x');
 * // {type: 'tuple', elements: [{type: 'tupleMember', name: 'x', elementType: 'number'}]}
 */
function overloadToTuple(section, expandType = expandTypeDepFree, ignored = new Set()) {
  const {params, tags} = parseJSDocDocument(section, expandType);
  const tagsByName = new Map();
  for (const tag of tags) {
    if (tagsByName.has(tag.name) === false) {
      tagsByName.set(tag.name, tag);
    }
  }
  const elements = [];
  for (const [name, type] of Object.entries(params || {})) {
    const tag = tagsByName.get(name);
    // A rest marker before the name (`{number[]} ...values`) is the
    // TS1003/TS8032 error: the master scan flags it invalid and skips the
    // phantom keys, so the member never materializes here.
    if (tag !== undefined && tag.invalidRest === true) {
      continue;
    }
    const optional = isExpandedObject(type) && type.optional === true;
    let elementType = type;
    if (optional) {
      elementType = {...type, optional: false};
    }
    let rest = false;
    if (tag !== undefined && tag.typeRaw.trim().startsWith('...')) {
      const resolved = tagRestElementType(tag, elementType);
      elementType = resolved.elementType;
      rest = resolved.dotDot;
    }
    if (ignored.has(name)) {
      const erased = rest && isArrayNode(elementType);
      if (erased) {
        elementType = {type: 'array', elementType: 'any'};
      } else {
        elementType = 'any';
      }
    }
    const member = {type: 'tupleMember', name, elementType};
    if (optional) {
      member.optional = true;
    }
    if (rest) {
      member.dotDot = true;
    }
    elements.push(member);
  }
  return {type: 'tuple', elements};
}
export {overloadToTuple};
