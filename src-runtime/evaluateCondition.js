import {typedefs} from "./registerTypedef.js";
import {classes} from "./registerClass.js";
/**
 * @param {*} type - A type or literal.
 * @returns {string|number|boolean|undefined} Stripped literal or itself.
 */
function stripLiteral(type) {
  if (typeof type === 'string' && type.length >= 2) {
    if ((type[0] === "'" && type[type.length - 1] === "'") ||
        (type[0] === '"' && type[type.length - 1] === '"')) {
      return type.slice(1, -1);
    }
  }
  return type;
}
/**
 * @param {*} type - A type or literal.
 * @returns {string|undefined} Quoted form usable in type positions, or itself.
 */
function literalType(type) {
  if (typeof type === 'string' && !typedefs[type]) {
    const stripped = stripLiteral(type);
    if (stripped !== type) {
      return type;
    }
    return `"${type}"`;
  }
  return type;
}
/**
 * @param {*} literal - A literal value.
 * @returns {string|undefined} Primitive base type or undefined.
 */
function baseOf(literal) {
  if (typeof literal === 'string') {
    return 'string';
  }
  if (typeof literal === 'number') {
    return 'number';
  }
  if (typeof literal === 'boolean') {
    return 'boolean';
  }
}
/**
 * Resolves typedefs, indexed access over object shapes and NonNullable
 * wrappers down to a concrete type for `extends` decisions.
 * @param {*} type - The type to resolve.
 * @param {console["warn"]} warn - Function to warn with.
 * @param {number} depth - The depth to detect recursion.
 * @returns {*} Resolved type, or `undefined` when unresolvable.
 */
function resolveForExtends(type, warn, depth = 0) {
  if (depth > 10) {
    return;
  }
  if (typeof type === 'string') {
    if (typedefs[type]) {
      return resolveForExtends(typedefs[type], warn, depth + 1);
    }
    return type;
  }
  if (!type || typeof type !== 'object') {
    return type;
  }
  if (type.type === 'indexedAccess') {
    const resolved = resolveForExtends(type.object, warn, depth + 1);
    if (!resolved || resolved.type !== 'object' || !resolved.properties) {
      return;
    }
    const key = stripLiteral(type.index);
    const prop = resolved.properties[key];
    if (prop === undefined) {
      return;
    }
    return resolveForExtends(prop, warn, depth + 1);
  }
  if (type.type === 'reference' && type.name === 'NonNullable' && Array.isArray(type.args) && type.args.length) {
    const inner = resolveForExtends(type.args[0], warn, depth + 1);
    if (inner === 'null' || inner === 'undefined') {
      return 'never';
    }
    if (inner && inner.type === 'union' && Array.isArray(inner.members)) {
      const kept = inner.members.filter((member) => member !== 'null' && member !== 'undefined');
      if (!kept.length) {
        return 'never';
      }
      if (kept.length === 1) {
        return resolveForExtends(kept[0], warn, depth + 1);
      }
      return {type: 'union', members: kept};
    }
    return inner;
  }
  if (type.type === 'union' && Array.isArray(type.members)) {
    return {type: 'union', members: type.members.map((member) => resolveForExtends(member, warn, depth + 1))};
  }
  return type;
}
const primitives = new Set(['string', 'number', 'boolean', 'bigint', 'symbol', 'undefined', 'object', 'function']);
/**
 * Decides `check extends target` over resolved types. Returns `undefined`
 * when undecidable (e.g. structural comparison); callers should fail open.
 * @param {*} check - Resolved check type.
 * @param {*} target - Resolved extends target.
 * @returns {boolean|undefined} Decision or undefined when undecidable.
 */
function extendsCheck(check, target) {
  if (check === undefined || target === undefined) {
    return undefined;
  }
  if (check === 'void') {
    check = 'undefined';
  }
  if (target === 'void') {
    target = 'undefined';
  }
  if (check === 'any' || target === 'any') {
    return true;
  }
  if (check === 'never') {
    return true;
  }
  if (target === 'never') {
    return check === 'never';
  }
  if (check === target) {
    return true;
  }
  if (check === 'null' || check === 'undefined') {
    return false;
  }
  if (typeof check === 'object' || typeof target === 'object') {
    if (check && check.type === 'union' && Array.isArray(check.members)) {
      let decided = true;
      for (const member of check.members) {
        const result = extendsCheck(member, target);
        if (result === false) {
          return false;
        }
        if (result === undefined) {
          decided = undefined;
        }
      }
      return decided;
    }
    if (target && target.type === 'union' && Array.isArray(target.members)) {
      for (const member of target.members) {
        if (extendsCheck(check, member) === true) {
          return true;
        }
      }
      return false;
    }
    return undefined;
  }
  // Quoted literals extend their primitive base ('"camera"' extends string);
  // mismatched literals and distinct primitives decisively do not.
  if (typeof check === 'string') {
    const stripped = stripLiteral(check);
    if (stripped !== check) {
      const base = baseOf(stripped);
      if (base !== undefined && target === base) {
        return true;
      }
      if (typeof target === 'string') {
        const targetStripped = stripLiteral(target);
        if (targetStripped !== target) {
          return stripped === targetStripped;
        }
        if (primitives.has(target)) {
          return false;
        }
      }
    } else if (primitives.has(check) && primitives.has(target)) {
      // Distinct primitives never extend each other.
      return false;
    }
  } else {
    const base = baseOf(check);
    if (base !== undefined) {
      if (target === base) {
        return true;
      }
      if (typeof target === 'string') {
        const targetStripped = stripLiteral(target);
        if (targetStripped !== target || primitives.has(target)) {
          return false;
        }
      }
    }
  }
  if (typeof target === 'string' && classes[target]) {
    // Class target: only subclasses (or itself) extend it. Primitives and
    // literals never do; other objects are undecidable rather than false.
    if (typeof check === 'string' && classes[check]) {
      if (check === target) {
        return true;
      }
      try {
        return classes[check].prototype instanceof classes[target];
      } catch {
        return undefined;
      }
    }
    if (check !== null && (typeof check === 'object' || baseOf(check) !== undefined)) {
      return baseOf(check) !== undefined ? false : undefined;
    }
    return false;
  }
  return undefined;
}
/**
 * Evaluates a substituted conditional type (`check extends target`).
 * @param {*} checkType - Substituted check type.
 * @param {*} extendsType - Substituted extends target.
 * @param {console["warn"]} warn - Function to warn with.
 * @returns {boolean|undefined} Decision or undefined when undecidable.
 */
function evaluateCondition(checkType, extendsType, warn) {
  return extendsCheck(resolveForExtends(checkType, warn), resolveForExtends(extendsType, warn));
}
export {evaluateCondition, extendsCheck, resolveForExtends, literalType, stripLiteral};
