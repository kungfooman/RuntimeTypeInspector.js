/**
 * Resolves one overload tag's rest shape. A rest marker with an optional
 * name is the TS2370 error: the member becomes `never` so every call
 * warns. Otherwise the expanded type flows through untouched: a `...T`
 * marker on an array type turns variadic over the gathered element, a
 * plain type passes through fixed. The expander already gathered the
 * element (`...number` reads as `number[]`, `...number[]` as
 * `number[][]`), so no second expansion of the written text is needed.
 * Non-array expansions (unions from `...T|U`, `rest` nodes from the
 * TypeScript parser) pass through for the runtime to handle.
 * @example
 * tagRestElementType({typeRaw: '...number[]', nameRaw: 'values', invalidRest: false, optional: false, name: 'values'}, {type: 'array', elementType: 'number'});
 * // {elementType: 'number', dotDot: true}
 * @param {import('./parseJSDoc.js').ParamTag} tag - Raw tag flags.
 * @param {*} type - Expanded type for the parameter.
 * @returns {{elementType: *, dotDot: boolean}} Unwrapped member type and rest flag.
 */
import {isArrayNode} from './isArrayNode.js';
function tagRestElementType(tag, type) {
  const markerInBraces = tag.typeRaw.trim().startsWith('...');
  if (markerInBraces && tag.optional === true) {
    return {elementType: 'never', dotDot: false};
  }
  if (markerInBraces && isArrayNode(type)) {
    return {elementType: type.elementType, dotDot: true};
  }
  return {elementType: type, dotDot: false};
}
export {tagRestElementType};
