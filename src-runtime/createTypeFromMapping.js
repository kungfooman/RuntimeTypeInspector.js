import {replaceType} from "./replaceType.js";
import {getTypeKeys} from "./getTypeKeys.js";
import {typedefs   } from "./registerTypedef.js";
import {evaluateCondition, literalType} from "./evaluateCondition.js";
/**
 * @param {any} str - Value to strip quotes from.
 * @returns {any} Stripped value.
 */
function stripQuotes(str) {
  if (typeof str === 'string' && str.length >= 2) {
    if ((str[0] === "'" && str[str.length - 1] === "'") ||
        (str[0] === '"' && str[str.length - 1] === '"')) {
      return str.slice(1, -1);
    }
  }
  return str;
}
/**
 * @param {*} type - Substituted true-branch of a remap condition.
 * @returns {string|number|undefined} Property key, or undefined when the
 * branch isn't a name (e.g. leftover variable or complex type).
 */
function branchName(type) {
  if (typeof type === 'number') {
    return type;
  }
  if (typeof type === 'string') {
    const stripped = stripQuotes(type);
    if (stripped !== type) {
      return stripped;
    }
  }
}
/**
 * Applies a mapping `?` modifier to a materialized property type: `-?`
 * strips optionality, `+?`/`?` force it, absent preserves the source.
 * Fresh objects only, never mutates shared typedefs.
 * @param {*} type - Materialized property type.
 * @param {string|undefined} question - Normalized modifier or undefined.
 * @returns {*} Property type, possibly wrapped.
 */
function applyQuestionModifier(type, question) {
  if (question === undefined) {
    return type;
  }
  if (question === '-') {
    // Stripping needs something to strip: resolve references so the flag
    // removal lands on a struct. Cloned, the registry is never mutated.
    let current = type;
    for (let i = 0; i < 10 && typeof current === 'string' && typedefs[current]; i++) {
      current = structuredClone(typedefs[current]);
    }
    if (current && typeof current === 'object') {
      delete current.optional;
    }
    return current;
  }
  if (type && typeof type === 'object') {
    type.optional = true;
    return type;
  }
  return {type, optional: true};
}
/**
 * @param {any} type - Type to flatten.
 * @returns {any} Flattened type.
 */
function flattenRest(type) {
  if (!type || typeof type !== 'object') {
    return type;
  }
  if (type.type === 'tuple' && Array.isArray(type.elements)) {
    const flat = [];
    for (const el of type.elements) {
      if (el && typeof el === 'object' && el.type === 'rest') {
        const ann = el.annotation;
        if (ann && ann.type === 'tuple' && Array.isArray(ann.elements)) {
          // Recursively flatten inner tuple first
          flattenRest(ann);
          flat.push(...ann.elements);
        } else if (ann) {
          flattenRest(ann);
          // For non-tuple rest (e.g., array), keep as is for validateTuple to handle
          flat.push(el);
        } else {
          flat.push(el);
        }
      } else {
        flattenRest(el);
        flat.push(el);
      }
    }
    type.elements = flat;
  } else if (type.type === 'object' && type.properties) {
    for (const key in type.properties) {
      flattenRest(type.properties[key]);
    }
  } else if ((type.type === 'union' || type.type === 'intersection') && Array.isArray(type.members)) {
    for (const m of type.members) {
      flattenRest(m);
    }
  } else if (type.type === 'array' && type.elementType) {
    flattenRest(type.elementType);
  } else if (type.type === 'rest' && type.annotation) {
    flattenRest(type.annotation);
  }
  return type;
}
/**
 * @param {string|import('./validateMapping.js').Mapping} expect - The supposed type information of said value.
 * @param {console["warn"]} warn - Function to warn with.
 * @returns {import('./validateType.js').TypeObject|undefined} - New type that can be used for validation.
 */
function createTypeFromMapping(expect, warn) {
  /** @todo some kind of resolveType(expect, 'mapping', depth = 0) function */
  if (typeof expect === 'string' && typedefs[expect]) {
    expect = typedefs[expect];
  }
  const {iterable, element, result, nameType, question} = expect;
  const typeKeys = getTypeKeys(iterable, warn);
  if (!typeKeys) {
    warn('validateMapping: missing typeKeys');
    return;
  }
  /** @type {Record<string, import('./validateType.js').Type>} */
  const properties = {};
  for (const typeKey of typeKeys) {
    const keyType = literalType(typeKey);
    const substituted = replaceType(structuredClone(result), element, keyType, warn);
    const propType = applyQuestionModifier(flattenRest(substituted), question);
    let propKey = stripQuotes(typeKey);
    if (nameType !== undefined) {
      // `as` key remapping: evaluate the (substituted) condition per key.
      const cloneCond = structuredClone(nameType);
      replaceType(cloneCond, element, keyType, warn);
      if (!cloneCond || cloneCond.type !== 'condition') {
        warn('validateMapping: nameType is not a condition after substitution', cloneCond);
      } else {
        const decision = evaluateCondition(cloneCond.checkType, cloneCond.extendsType, warn);
        if (decision === false) {
          continue;
        }
        if (decision === true) {
          const trueName = branchName(cloneCond.trueType, warn);
          if (trueName !== undefined) {
            propKey = trueName;
          } else {
            warn('validateMapping: unresolvable true-branch, keeping key', {typeKey});
          }
        } else {
          warn('validateMapping: undecidable condition, keeping key', {typeKey});
        }
      }
    }
    properties[propKey] = propType;
  }
  return {type: 'object', properties, optional: false};
}
export {createTypeFromMapping};
