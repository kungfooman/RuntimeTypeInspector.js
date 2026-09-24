import {typedefs, typedefTemplates} from "./registerTypedef.js";
import {classes} from "./registerClass.js";
import {validators, recurse} from "./validators.js";
import {replaceType} from "./replaceType.js";
import {createTypeFromMapping} from "./createTypeFromMapping.js";
import {getTypeKeys} from "./getTypeKeys.js";
import {extendsCheck, resolveForExtends, stripLiteral, deepEqualType} from "./evaluateCondition.js";
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
 * Applies an intrinsic string mapping to literal text.
 * @param {string} name - One of Uppercase/Lowercase/Capitalize/Uncapitalize.
 * @param {string} text - Literal text.
 * @returns {string} Mapped text.
 */
function applyStringIntrinsic(name, text) {
  switch (name) {
    case 'Uppercase':
      return text.toUpperCase();
    case 'Lowercase':
      return text.toLowerCase();
    case 'Capitalize':
      return text.length ? text[0].toUpperCase() + text.slice(1) : text;
    default:
      return text.length ? text[0].toLowerCase() + text.slice(1) : text;
  }
}
/**
 * Checks a broad string against an intrinsic mapping.
 * @param {string} name - One of Uppercase/Lowercase/Capitalize/Uncapitalize.
 * @param {string} value - The value.
 * @returns {boolean} True when the value already satisfies the mapping.
 */
function checkStringIntrinsic(name, value) {
  switch (name) {
    case 'Uppercase':
      return value === value.toUpperCase();
    case 'Lowercase':
      return value === value.toLowerCase();
    case 'Capitalize':
      return !value.length || value[0] === value[0].toUpperCase();
    default:
      return !value.length || value[0] === value[0].toLowerCase();
  }
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
    case 'IfEquals': {
      // Identity comparison for WritableKeys-style filtering. Missing A/B
      // fall back to the TypeScript defaults (A=X, B=never).
      const [X, Y, A, B] = args ?? [];
      if (X === undefined || Y === undefined) {
        warn('IfEquals requires two type arguments.', {expect});
        return false;
      }
      const materialize = (side) => {
        if (side && side.type === 'mapping') {
          return createTypeFromMapping(side, warn);
        }
        return resolveForExtends(side, warn) ?? side;
      };
      const resolvedX = materialize(X);
      const resolvedY = materialize(Y);
      if (resolvedX === undefined || resolvedY === undefined) {
        warn('IfEquals: undecidable comparison, failing closed.', {expect});
        return false;
      }
      if (deepEqualType(resolvedX, resolvedY)) {
        return recurse(value, A ?? X, loc, name, critical, warn, depth + 1);
      }
      return recurse(value, B ?? 'never', loc, name, critical, warn, depth + 1);
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
    case 'Exclude': {
      const [from, to] = args ?? [];
      if (from === undefined || to === undefined) {
        warn('Exclude requires two type arguments.', {expect});
        return false;
      }
      const resolvedTo = resolveForExtends(to, warn);
      const resolvedFrom = resolveForExtends(from, warn) ?? from;
      const members = resolvedFrom && resolvedFrom.type === 'union' && Array.isArray(resolvedFrom.members) ? resolvedFrom.members : [resolvedFrom];
      const kept = members.filter((member) => extendsCheck(resolveForExtends(member, warn), resolvedTo, warn) !== true);
      if (!kept.length) {
        warn('Exclude kept no members.', {expect});
        return false;
      }
      if (kept.length === 1) {
        return recurse(value, kept[0], loc, name, critical, warn, depth + 1);
      }
      return recurse(value, {type: 'union', members: kept}, loc, name, critical, warn, depth + 1);
    }
    case 'Required': {
      if (!firstArg) {
        warn('Required requires one type argument.', {expect});
        return false;
      }
      const object = resolveObjectArg(firstArg, warn);
      if (!object) {
        warn('Required requires an object type argument.', {expect});
        return false;
      }
      // Required is shallow: only top-level optionality is stripped.
      const properties = {};
      for (const key of Object.keys(object.properties)) {
        const prop = object.properties[key];
        properties[key] = prop && typeof prop === 'object' ? {...prop, optional: false} : prop;
      }
      return recurse(value, {type: 'object', properties}, loc, name, critical, warn, depth + 1);
    }
    case 'Awaited': {
      if (!firstArg) {
        warn('Awaited requires one type argument.', {expect});
        return false;
      }
      let inner = firstArg;
      for (let i = 0; i < 10 && inner && inner.type === 'promise'; i++) {
        inner = inner.elementType;
      }
      if (inner !== firstArg) {
        // Was (possibly nested) Promise: resolved values are unobservable
        // synchronously, so only the instanceof check applies.
        return recurse(value, {type: 'promise', elementType: inner}, loc, name, critical, warn, depth + 1);
      }
      return recurse(value, inner, loc, name, critical, warn, depth + 1);
    }
    case 'NoInfer': {
      // Blocks inference in TypeScript; the runtime shape is unchanged.
      if (!firstArg) {
        warn('NoInfer requires one type argument.', {expect});
        return false;
      }
      return recurse(value, firstArg, loc, name, critical, warn, depth + 1);
    }
    case 'Uppercase':
    case 'Lowercase':
    case 'Capitalize':
    case 'Uncapitalize': {
      if (firstArg === undefined) {
        warn(`${refName} requires one type argument.`, {expect});
        return false;
      }
      const resolved = resolveForExtends(firstArg, warn) ?? firstArg;
      if (resolved && resolved.type === 'union' && Array.isArray(resolved.members)) {
        // Intrinsics distribute over unions, like TypeScript does.
        const members = [];
        for (const member of resolved.members) {
          if (typeof member !== 'string' || stripLiteral(member) === member) {
            warn(`${refName} needs string literals or string.`, {expect});
            return false;
          }
          members.push(`"${applyStringIntrinsic(refName, stripLiteral(member))}"`);
        }
        return recurse(value, {type: 'union', members}, loc, name, critical, warn, depth + 1);
      }
      if (typeof resolved === 'string') {
        const stripped = stripLiteral(resolved);
        if (stripped !== resolved) {
          const expected = applyStringIntrinsic(refName, stripped);
          if (value !== expected) {
            warn(`Expected ${expected}.`, {value, expect});
          }
          return value === expected;
        }
        if (resolved === 'string') {
          if (typeof value !== 'string' || !checkStringIntrinsic(refName, value)) {
            warn(`Expected ${refName}<string>.`, {value, expect});
            return false;
          }
          return true;
        }
      }
      warn(`${refName} needs a string literal or string argument.`, {expect});
      return false;
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
    const params = typedefTemplates[refName];
    if (args?.length && params?.length) {
      // Generic typedef: instantiate by substituting arguments for parameters.
      let instance = structuredClone(typedefs[refName]);
      params.forEach((param, i) => {
        instance = replaceType(instance, param, i < args.length ? args[i] : 'any', warn);
      });
      return recurse(value, instance, loc, name, critical, warn, depth + 1);
    }
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
