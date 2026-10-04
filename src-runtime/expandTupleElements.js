/**
 * Expands rest elements like validation does: `...[1,2,3]` spreads,
 * `...T[]` becomes the single variadic (with its position), anything else
 * stays one element; named `...b: T[]` (`tupleMember` with `dotDot`)
 * converts first. Shared with the explainer (see `tupleEffective`).
 * @param {any[]} elements - Raw tuple elements.
 * @returns {{expanded: any[], variadic: *, variadicPos: number, error: *}} Expanded list plus variadic slot, or an error for multiple variadics.
 * @example
 * expandTupleElements(['number', {type: 'rest', annotation: {type: 'array', elementType: 'string'}}]);
 * // {expanded: ['number'], variadic: {type: 'array', elementType: 'string'}, variadicPos: 1, error: undefined}
 */
function expandTupleElements(elements) {
  // Expand rest elements: ...[1,2,3] -> 1,2,3 ; ...T[] -> variadic ; ...b: T[] -> variadic
  const expanded = [];
  let variadic = null;
  let variadicPos = -1;
  for (const el of elements) {
    let raw = el;
    // Named rest: ...b: number[]  (tupleMember with dotDot)
    if (el && typeof el === 'object' && el.type === 'tupleMember' && el.dotDot) {
      raw = { type: 'rest', annotation: el.elementType };
    }
    if (raw && typeof raw === 'object' && raw.type === 'rest') {
      const ann = raw.annotation;
      if (ann && ann.type === 'tuple' && Array.isArray(ann.elements)) {
        expanded.push(...ann.elements);
      } else if (ann && ann.type === 'array') {
        if (variadic) {
          return {expanded, variadic, variadicPos, error: 'multiple-variadic'};
        }
        variadic = ann;
        variadicPos = expanded.length;
      } else if (ann) {
        expanded.push(ann);
      }
    } else {
      expanded.push(el);
    }
  }
  return {expanded, variadic, variadicPos, error: undefined};
}
export {expandTupleElements};
