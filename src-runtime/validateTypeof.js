import {classes} from "./registerClass.js";
import {variables} from "./registerVariable.js";
/**
 * Looks up a constructor by name beyond the class registry: engine builds
 * keep platform constructors (e.g. `Float32Array`) unregistered, but they
 * still hang off `globalThis`/`window`.
 * @param {string} name - The constructor name.
 * @returns {Function|undefined} The constructor, or undefined.
 */
function lookupGlobalConstructor(name) {
  try {
    const direct = globalThis[name];
    if (typeof direct === 'function') {
      return direct;
    }
  } catch {
    // Cross-realm lookups can throw; fall through to window.
  }
  try {
    if (typeof window !== 'undefined') {
      const viaWindow = window[name];
      if (typeof viaWindow === 'function') {
        return viaWindow;
      }
      if (typeof name === 'string' && name.startsWith('globalThis.')) {
        const inner = window[name.slice(11)];
        if (typeof inner === 'function') {
          return inner;
        }
      }
    }
  } catch {
    // Storage access can throw; unresolvable either way.
  }
  return undefined;
}
/**
 * @param {*} value - The actual value that we need to validate.
 * @param {*} expect - The supposed type information of said value.
 * @param {string} loc - String like `BoundingBox#compute`
 * @param {string} name - Name of the argument
 * @param {boolean} critical - Only `false` for unions.
 * @param {console["warn"]} warn - Function to warn with.
 * @param {number} depth - The depth to detect recursion.
 * @returns {boolean} Boolean indicating if a type is correct.
 */
export function validateTypeof(value, expect, loc, name, critical, warn, depth) {
  const target = expect.argument;
  const ctor = classes[target] ?? (typeof target === 'string' ? lookupGlobalConstructor(target) : undefined);
  if (typeof ctor === 'function') {
    if (value === ctor) {
      return true;
    }
    // `typeof Base` accepts subclass constructors: `createScript` results,
    // ESM `Script` subclasses and any `class Child extends Base` carry the
    // base prototype, so identity alone false-positives on every subclass.
    let inherits = false;
    try {
      inherits = typeof value === 'function' && value.prototype instanceof ctor;
    } catch {
      inherits = false;
    }
    if (inherits) {
      return true;
    }
    warn(`Expected typeof ${target}.`, {value, expect});
    return false;
  }
  // `typeof someValue`: the argument names a registered value rather than a
  // class. A constructor value behaves like the class case above; otherwise
  // the parameter must share the value's apparent type (primitives compare
  // by `typeof`, objects by constructor so subclass instances still pass).
  if (typeof target === 'string' && Object.prototype.hasOwnProperty.call(variables, target)) {
    const ref = variables[target];
    if (typeof ref === 'function') {
      if (value === ref) {
        return true;
      }
      let inherits = false;
      try {
        inherits = typeof value === 'function' && value.prototype instanceof ref;
      } catch {
        inherits = false;
      }
      if (inherits) {
        return true;
      }
      warn(`Expected typeof ${target}.`, {value, expect});
      return false;
    }
    if ((ref === null || typeof ref !== 'object') && (value === null || typeof value !== 'object')) {
      if (typeof value === typeof ref) {
        return true;
      }
      warn(`Expected typeof ${target}.`, {value, expect});
      return false;
    }
    const refCtor = ref?.constructor;
    if (typeof refCtor === 'function') {
      let passes = false;
      try {
        passes = value instanceof refCtor;
      } catch {
        passes = false;
      }
      if (passes) {
        return true;
      }
      warn(`Expected typeof ${target}.`, {value, expect});
      return false;
    }
  }
  warn('unchecked', {value, type: 'typeof', loc, name, expect});
  return false;
}
