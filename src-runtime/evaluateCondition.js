import {typedefs} from "./registerTypedef.js";
import {classes} from "./registerClass.js";
import {getTypeKeys} from "./getTypeKeys.js";
import {validators} from "./validators.js";
validators.evaluateCondition = evaluateCondition;
validators.decideIfEquals = decideIfEquals;
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
    // Class names keep their identity for prototype-chain decisions in
    // extendsCheck; plain typedefs resolve to their shape. (resolveObject,
    // which reads keys, prefers typedefs instead: different master.)
    if (classes[type]) {
      return type;
    }
    if (typedefs[type]) {
      return resolveForExtends(typedefs[type], warn, depth + 1);
    }
    return type;
  }
  if (!type || typeof type !== 'object') {
    return type;
  }
  if (type.type === 'indexedAccess') {
    // Shapes, not identities, are needed here even for classes.
    let rawObject = type.object;
    if (typeof rawObject === 'string' && typedefs[rawObject]) {
      rawObject = typedefs[rawObject];
    }
    let object = resolveForExtends(rawObject, warn, depth + 1);
    // Follow names through typedefs: indexed access reads static shapes,
    // so class/shorthand names resolve to their property maps here
    // (identity checks keep the name; see the string branch above).
    for (let i = 0; i < 10 && typeof object === 'string' && typedefs[object]; i++) {
      object = resolveForExtends(typedefs[object], warn, depth + 1);
    }
    if (object && object.type === 'mapping') {
      const materialize = validators.materializeMapping;
      const materialized = materialize ? materialize(object, warn) : undefined;
      if (materialized) {
        object = materialized;
      }
    }
    if (!object || object.type !== 'object' || !object.properties) {
      return;
    }
    const key = stripLiteral(type.index);
    const prop = object.properties[key];
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
  if (type.type === 'keyof') {
    const keys = getTypeKeys(type.argument, warn);
    if (!Array.isArray(keys)) {
      return;
    }
    return {type: 'union', members: keys.map((key) => (typeof key === 'string' ? literalType(key) : key))};
  }
  return type;
}
const primitives = new Set(['string', 'number', 'boolean', 'bigint', 'symbol', 'undefined', 'object', 'function']);
/**
 * Canonicalizes a type for structural comparison: sorted keys, `false`
 * flags normalized to absent (both mean the same in RTI semantics).
 * @param {*} type - The type.
 * @returns {*} Canonical form safe for JSON comparison.
 */
function canonicalize(type) {
  if (Array.isArray(type)) {
    return type.map(canonicalize);
  }
  if (type && typeof type === 'object') {
    const out = {};
    for (const key of Object.keys(type).sort()) {
      const value = type[key];
      if (value === undefined) {
        continue;
      }
      if ((key === 'optional' || key === 'readonly') && value === false) {
        continue;
      }
      out[key] = canonicalize(value);
    }
    return out;
  }
  return type;
}
/**
 * Structural type identity for IfEquals-style comparisons.
 * @param {*} a - First type.
 * @param {*} b - Second type.
 * @returns {boolean} True when structurally identical.
 */
function deepEqualType(a, b) {
  return JSON.stringify(canonicalize(a)) === JSON.stringify(canonicalize(b));
}
/**
 * Decides a string literal against a template literal type. Only single
 * interpolation is decided (`_${string}`, `` `${A}_id` `` with literal
 * members); anything more complex is undecidable.
 * @param {string} check - Stripped literal text.
 * @param {object} target - Template literal type.
 * @returns {boolean|undefined} Decision or undefined when undecidable.
 */
function extendsTemplateLiteral(check, target) {
  const {quasis, types} = target;
  if (!Array.isArray(quasis) || !Array.isArray(types)) {
    return undefined;
  }
  if (!types.length) {
    return check === quasis[0];
  }
  if (types.length !== 1 || quasis.length !== 2) {
    return undefined;
  }
  const [pre, post] = quasis;
  if (pre.length + post.length > check.length || !check.startsWith(pre) || !check.endsWith(post)) {
    return false;
  }
  const middle = post ? check.slice(pre.length, -post.length) : check.slice(pre.length);
  return extendsCheck(`"${middle}"`, types[0]);
}
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
  if (check && check.type === 'templateLiteral' && Array.isArray(check.types) && !check.types.length) {
    // Bare template without interpolation is just its literal text.
    check = `"${check.quasis[0] ?? ''}"`;
  }
  if (check === 'null' || check === 'undefined') {
    return false;
  }
  if (typeof target === 'string' && (target === 'Function' || target === 'CallableFunction' || target === 'NewableFunction')) {
    if (check && (check.type === 'function' || check.type === 'new')) {
      return true;
    }
    if (typeof check === 'string') {
      if (check === 'function') {
        return true;
      }
      if (classes[check]) {
        // Class instances are never callable.
        return false;
      }
      const stripped = stripLiteral(check);
      if (stripped !== check || primitives.has(check) || check === 'unknown' || check === 'null') {
        // Literals, primitives and null never extend Function.
        // Other names stay undecidable rather than failing closed.
        return false;
      }
    }
    if (check && typeof check === 'object' && check.type !== undefined &&
        check.type !== 'reference' && check.type !== 'typeof' && check.type !== 'condition' &&
        check.type !== 'intersection' && check.type !== 'union') {
      // Resolved shapes that aren't callable never extend Function. Unions
      // distribute through the member loop below; references and other
      // deferred forms stay undecidable rather than failing closed.
      return false;
    }
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
    if (target && target.type === 'templateLiteral') {
      if (typeof check === 'string') {
        const stripped = stripLiteral(check);
        if (stripped !== check) {
          return extendsTemplateLiteral(stripped, target);
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
 * Decides IfEquals-style identity: materializes single-key mappings, then
 * compares structurally (readonly- and optional-sensitive).
 * @param {*} X - First side.
 * @param {*} Y - Second side.
 * @param {console["warn"]} warn - Function to warn with.
 * @returns {boolean|undefined} Decision or undefined when undecidable.
 */
function decideIfEquals(X, Y, warn) {
  const materialize = validators.materializeMapping;
  const prepare = (side) => {
    const resolved = resolveForExtends(side, warn) ?? side;
    if (resolved && resolved.type === 'mapping' && materialize) {
      return materialize(resolved, warn) ?? resolved;
    }
    return resolved;
  };
  const preparedX = prepare(X);
  const preparedY = prepare(Y);
  if (preparedX === undefined || preparedY === undefined) {
    return undefined;
  }
  if (deepEqualType(preparedX, preparedY)) {
    return true;
  }
  if (preparedX?.type === 'mapping' || preparedY?.type === 'mapping') {
    return undefined;
  }
  return false;
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
export {evaluateCondition, extendsCheck, resolveForExtends, literalType, stripLiteral, deepEqualType, decideIfEquals};
