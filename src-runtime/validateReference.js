import {typedefs} from "./registerTypedef.js";
import {classes} from "./registerClass.js";
import {validators, recurse} from "./validators.js";
import {createTypeFromMapping} from "./createTypeFromMapping.js";
import {getTypeKeys} from "./getTypeKeys.js";
import {extendsCheck, resolveForExtends, stripLiteral} from "./evaluateCondition.js";
/**
 * Follows strings through typedefs (and materializes mappings) to an
 * object shape. Never mutates the registry: callers build fresh containers.
 * @param {*} type - The type to resolve.
 * @param {console["warn"]} warn - Function to warn with.
 * @returns {object|undefined} Object shape or undefined.
 */
function resolveObjectArg(type, warn) {
  let current = type;
  for (let i = 0; i < 10; i++) {
    if (typeof current === 'string') {
      if (!typedefs[current]) {
        return;
      }
      current = typedefs[current];
      continue;
    }
    if (current && current.type === 'mapping') {
      current = createTypeFromMapping(current, warn);
      continue;
    }
    break;
  }
  if (current && current.type === 'object' && current.properties) {
    return current;
  }
}
/**
 * @param {*} prop - A property type.
 * @returns {object} Same type marked optional, without mutating the input.
 */
function asOptional(prop) {
  if (prop && typeof prop === 'object') {
    return {...prop, optional: true};
  }
  return {type: prop, optional: true};
}
/**
 * Reads a key list from a union of literals (or anything getTypeKeys handles).
 * @param {*} keyType - The key type.
 * @param {console["warn"]} warn - Function to warn with.
 * @returns {string[]|undefined} Stripped key names or undefined.
 */
function keyList(keyType, warn) {
  if (keyType && keyType.type === 'union' && Array.isArray(keyType.members)) {
    return keyType.members.map((member) => (typeof member === 'string' ? stripLiteral(member) : member)).filter((key) => typeof key === 'string');
  }
  const keys = getTypeKeys(keyType, warn);
  if (Array.isArray(keys)) {
    return keys.map((key) => (typeof key === 'string' ? stripLiteral(key) : key)).filter((key) => typeof key === 'string');
  }
}
/**
 * @param {*} value - The actual value that we need to validate.
 * @param {*} elementType - The element type each indexed entry must satisfy.
 * @param {string} loc - String like `BoundingBox#compute`
 * @param {string} name - Name of the argument
 * @param {boolean} critical - Only `false` for unions.
 * @param {console["warn"]} warn - Function to warn with.
 * @param {number} depth - The depth to detect recursion.
 * @returns {boolean} Boolean indicating if a type is correct.
 */
/**
 * @param {*} value - The actual value that we need to validate.
 * @param {import('./validateType.js').TypeObject} expect - The supposed type information of said value.
 * @param {string} loc - String like `BoundingBox#compute`
 * @param {string} name - Name of the argument
 * @param {boolean} critical - Only `false` for unions.
 * @param {console["warn"]} warn - Function to warn with.
 * @param {number} depth - The depth to detect recursion.
 * @returns {boolean} Boolean indicating if a type is correct.
 */
function validateReference(value, expect, loc, name, critical, warn, depth) {
  const {name: refName, args} = expect;
  const firstArg = args?.[0];
  switch (refName) {
    case 'ArrayLike':
    case 'NodeListOf':
    case 'HTMLCollectionOf':
    case 'NodeList':
    case 'HTMLCollection':
      // Bare `ArrayLike` / DOM list types without <T>: shape-only check.
      return validators.validateArrayLike(value, firstArg ?? 'any', loc, name, critical, warn, depth + 1);
    case 'ReadonlyArray':
      // Readonly-ness is erased at runtime, same shape as Array.
      if (!firstArg) {
        warn('ReadonlyArray requires one type argument.', {expect});
        return false;
      }
      return validators.validateArray(value, {type: 'array', elementType: firstArg}, loc, name, critical, warn, depth + 1);
    case 'ConcatArray':
      // ConcatArray<T> is array-like (length + indexed access) plus join/slice.
      // Accept anything array-like here; arrays trivially satisfy it.
      if (!firstArg) {
        warn('ConcatArray requires one type argument.', {expect});
        return false;
      }
      return validators.validateArrayLike(value, firstArg, loc, name, critical, warn, depth + 1);
    case 'Readonly':
      // Readonly<T> doesn't change the runtime shape.
      if (!firstArg) {
        warn('Readonly requires one type argument.', {expect});
        return false;
      }
      return recurse(value, firstArg, loc, name, critical, warn, depth + 1);
    case 'NonNullable':
      if (!firstArg) {
        warn('NonNullable requires one type argument.', {expect});
        return false;
      }
      if (value === null || value === undefined) {
        warn('Expected NonNullable, got null/undefined.', {value});
        return false;
      }
      return recurse(value, firstArg, loc, name, critical, warn, depth + 1);
    case 'Partial': {
      if (!firstArg) {
        warn('Partial requires one type argument.', {expect});
        return false;
      }
      const object = resolveObjectArg(firstArg, warn);
      if (!object) {
        warn('Partial requires an object type argument.', {expect});
        return false;
      }
      const properties = {};
      for (const key of Object.keys(object.properties)) {
        properties[key] = asOptional(object.properties[key]);
      }
      return recurse(value, {type: 'object', properties}, loc, name, critical, warn, depth + 1);
    }
    case 'Pick':
    case 'Omit': {
      const [target, keys] = args ?? [];
      if (!target || keys === undefined) {
        warn(`${refName} requires two type arguments.`, {expect});
        return false;
      }
      const object = resolveObjectArg(target, warn);
      const names = keyList(keys, warn);
      if (!object || !names) {
        warn(`${refName} requires an object and key names.`, {expect});
        return false;
      }
      const wanted = new Set(names);
      const properties = {};
      for (const key of Object.keys(object.properties)) {
        if (wanted.has(key) === (refName === 'Pick')) {
          properties[key] = object.properties[key];
        }
      }
      return recurse(value, {type: 'object', properties}, loc, name, critical, warn, depth + 1);
    }
    case 'Extract': {
      const [from, to] = args ?? [];
      if (from === undefined || to === undefined) {
        warn('Extract requires two type arguments.', {expect});
        return false;
      }
      const resolvedTo = resolveForExtends(to, warn);
      // Distribute over named unions too: resolve first, then filter members.
      const resolvedFrom = resolveForExtends(from, warn) ?? from;
      const members = resolvedFrom && resolvedFrom.type === 'union' && Array.isArray(resolvedFrom.members) ? resolvedFrom.members : [resolvedFrom];
      const kept = members.filter((member) => extendsCheck(resolveForExtends(member, warn), resolvedTo, warn) !== false);
      if (!kept.length) {
        warn('Extract kept no members.', {expect});
        return false;
      }
      if (kept.length === 1) {
        return recurse(value, kept[0], loc, name, critical, warn, depth + 1);
      }
      return recurse(value, {type: 'union', members: kept}, loc, name, critical, warn, depth + 1);
    }
    case 'Iterable':
    case 'IterableIterator':
      if (value === null || value === undefined) {
        warn(`Expected ${refName}, got ${value}.`, {value});
        return false;
      }
      if (typeof value[Symbol.iterator] !== 'function') {
        warn(`Expected ${refName} with [Symbol.iterator].`, {value});
        return false;
      }
      if (firstArg && value instanceof Array) {
        return validators.validateArrayLike(value, firstArg, loc, name, critical, warn, depth + 1);
      }
      return true;
    case 'AsyncIterable':
    case 'AsyncIterableIterator':
      if (value === null || value === undefined) {
        warn(`Expected ${refName}, got ${value}.`, {value});
        return false;
      }
      if (typeof value[Symbol.asyncIterator] !== 'function') {
        warn(`Expected ${refName} with [Symbol.asyncIterator].`, {value});
        return false;
      }
      return true;
  }
  if (typedefs[refName] && !classes[refName]) {
    if (args?.length) {
      warn(`Generic typedef '${refName}' with type arguments isn't supported yet, validating against raw typedef.`, {expect});
    }
    return recurse(value, typedefs[refName], loc, name, critical, warn, depth + 1);
  }
  if (classes[refName]) {
    return value instanceof classes[refName];
  }
  if (value && value.constructor && value.constructor.name === refName) {
    return true;
  }
  if (typeof globalThis !== 'undefined') {
    const globalClass = globalThis[refName];
    if (globalClass && value instanceof globalClass) {
      return true;
    }
  }
  warn('unchecked', {value, type: 'reference', loc, name, expect});
  return false;
}
export {validateReference};
