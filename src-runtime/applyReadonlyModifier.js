import {typedefs} from "./registerTypedef.js";
/**
 * Applies a mapping `readonly` modifier to a materialized property type:
 * `-readonly` strips the flag, `+readonly`/`readonly` force it, absent
 * preserves the source. References resolve first so the flag lands.
 * @param {*} type - Materialized property type.
 * @param {string|undefined} modifier - Normalized modifier or undefined.
 * @returns {*} Property type, possibly wrapped.
 * @example
 * applyReadonlyModifier('string', '+readonly');
 * // {type: 'string', readonly: true}
 * applyReadonlyModifier({type: 'string', readonly: true}, '-');
 * // {type: 'string'}
 */
function applyReadonlyModifier(type, modifier) {
  if (modifier === undefined) {
    return type;
  }
  if (modifier === '-') {
    if (typeof type === 'string') {
      let current = type;
      for (let i = 0; i < 10 && typeof current === 'string' && typedefs[current]; i++) {
        current = structuredClone(typedefs[current]);
        if (typeof current !== 'string') {
          break;
        }
      }
      if (current && typeof current === 'object' && current.readonly) {
        delete current.readonly;
        return current;
      }
      return type;
    }
    if (type && typeof type === 'object') {
      if (!('readonly' in type)) {
        return type;
      }
      const out = {...type};
      delete out.readonly;
      return out;
    }
    return type;
  }
  if (type && typeof type === 'object') {
    if (type.readonly === true) {
      return type;
    }
    return {...type, readonly: true};
  }
  return {type, readonly: true};
}
export {applyReadonlyModifier};
