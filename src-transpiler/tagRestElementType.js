/**
 * Resolves one overload tag's rest shape. A rest marker with an optional
 * name is the TS2370 error: the member becomes `never` so every call
 * warns. Other spellings never reject. A `...T[]` tag turns variadic
 * over `T[]`'s element type (the inner array is the written element
 * type); a `...T` tag turns variadic over the tag's expanded `T`, which
 * the expander already gathered into an array when `T` is a plain name
 * (`...number` reads as `number[]`). Array-element spellings of the bare
 * form (`...number[]`) keep their nesting, so trailing positions now
 * match tsc and leading lone positions reject like tsc does.
 * @example
 * tagRestElementType({typeRaw: '...number[]', nameRaw: 'values', invalidRest: false, optional: false, name: 'values'}, {type: 'array', elementType: 'number'});
 * // {elementType: 'number', dotDot: true}
 * @param {import('./parseJSDocTags.js').ParamTag} tag - Raw tag flags.
 * @param {*} type - Expanded type for the parameter.
 * @returns {{elementType: *, dotDot: boolean}} Unwrapped member type and rest flag.
 */
function tagRestElementType(tag, type) {
  const markerInBraces = tag.typeRaw.trim().startsWith('...');
  const taggedOptional = tag.optional === true;
  const rejectedOptional = markerInBraces && taggedOptional;
  if (rejectedOptional) {
    return {elementType: 'never', dotDot: false};
  }
  const restTarget = markerInBraces &&
    type !== null &&
    typeof type === 'object' &&
    type.type === 'array';
  if (restTarget === false) {
    return {elementType: type, dotDot: false};
  }
  const written = tag.typeRaw.trim().slice(3).trim();
  const writtenIsArray = written.endsWith('[]') || written.startsWith('Array<');
  const inner = type.elementType;
  if (writtenIsArray) {
    const innerIsArray = inner !== null &&
      typeof inner === 'object' &&
      inner.type === 'array';
    if (innerIsArray) {
      return {elementType: inner, dotDot: true};
    }
    return {elementType: type, dotDot: false};
  }
  return {elementType: inner, dotDot: true};
}
export {tagRestElementType};
