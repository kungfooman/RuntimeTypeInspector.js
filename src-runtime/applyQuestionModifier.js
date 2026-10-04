import {typedefs} from "./registerTypedef.js";
/**
 * Applies a mapping `?` modifier to a materialized property type: `-?`
 * strips optionality, `+?`/`?` force it, absent preserves the source.
 * Fresh objects only, never mutates shared typedefs.
 * @param {*} type - Materialized property type.
 * @param {string|undefined} question - Normalized modifier or undefined.
 * @returns {*} Property type, possibly wrapped.
 * @example
 * applyQuestionModifier('string', '+');
 * // {type: 'string', optional: true}
 * applyQuestionModifier({type: 'string', optional: true}, '-');
 * // {type: 'string'}
 */
function applyQuestionModifier(type, question) {
  if (question === undefined) {
    return type;
  }
  if (question === '-') {
    // Stripping resolves references only when there is a flag to strip:
    // expanding unconditionally (e.g. `Color` -> `{r, g, b, a}`) changes
    // identity and breaks structural comparisons like `IfEquals`, which
    // must see the same spelling on both sides when neither side is
    // optional. Cloned, the registry is never mutated.
    if (typeof type === 'string') {
      let current = type;
      for (let i = 0; i < 10 && typeof current === 'string' && typedefs[current]; i++) {
        current = structuredClone(typedefs[current]);
        if (typeof current !== 'string') {
          break;
        }
      }
      if (current && typeof current === 'object' && current.optional) {
        delete current.optional;
        return current;
      }
      return type;
    }
    if (type && typeof type === 'object') {
      if (!('optional' in type)) {
        return type;
      }
      const out = {...type};
      delete out.optional;
      return out;
    }
    return type;
  }
  if (type && typeof type === 'object') {
    if (type.optional === true) {
      return type;
    }
    return {...type, optional: true};
  }
  return {type, optional: true};
}
export {applyQuestionModifier};
