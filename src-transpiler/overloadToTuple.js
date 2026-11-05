import {parseJSDoc} from './parseJSDoc.js';
import {parseJSDocTags} from './parseJSDocTags.js';
import {tagRestElementType} from './tagRestElementType.js';
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
  const params = parseJSDoc(section, expandType) || {};
  const tags = parseJSDocTags(section);
  const tagsByName = new Map();
  const droppedNames = new Set();
  for (const tag of tags) {
    if (tagsByName.has(tag.name) === false) {
      tagsByName.set(tag.name, tag);
    }
    if (tag.invalidRest === true) {
      droppedNames.add(tag.name.slice(3).trim());
    }
  }
  const elements = [];
  for (const [name, type] of Object.entries(params)) {
    const tag = tagsByName.get(name);
    // A rest marker before the name (`{number[]} ...values`) is the
    // TS1003/TS8032 error and is dropped. The parser splits the dots into
    // phantom keys (`''` plus the stripped name), so the stripped name is
    // dropped via the set while the empty key falls out with other
    // untagged dot-garbage; untagged real names (inline `@overload @param`
    // sections the line scanner skips) still pass.
    const tagInvalidRest = tag !== undefined && tag.invalidRest === true;
    const phantomRest = tag === undefined && (name === '' || name.startsWith('...'));
    const droppedRest = (
      tagInvalidRest ||
      droppedNames.has(name) ||
      phantomRest
    );
    if (droppedRest) {
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
