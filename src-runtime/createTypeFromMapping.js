import {replaceType} from "./replaceType.js";
import {getTypeKeys} from "./getTypeKeys.js";
import {typedefs   } from "./registerTypedef.js";
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
  const {iterable, element, result} = expect;
  const typeKeys = getTypeKeys(iterable, warn);
  if (!typeKeys) {
    warn('validateMapping: missing typeKeys');
    return;
  }
  /** @type {Record<string, import('./validateType.js').Type>} */
  const properties = {};
  for (const typeKey of typeKeys) {
    const cloneResult = structuredClone(result);
    replaceType(cloneResult, element, typeKey, warn);
    flattenRest(cloneResult);
    const propKey = stripQuotes(typeKey);
    properties[propKey] = cloneResult;
  }
  return {type: 'object', properties, optional: false};
}
export {createTypeFromMapping};
