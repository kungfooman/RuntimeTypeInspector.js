import {customTypes      } from "./customTypes.mjs";
import {customValidations} from "./customValidations.mjs";
import {classes          } from "./registerClass.mjs";
import {typedefs         } from "./registerTypedef.mjs";
import {validateArray    } from "./validateArray.mjs";
import {validateKeyof    } from "./validateKeyof.mjs";
import {validateMap      } from "./validateMap.mjs";
import {validateNumber   } from "./validateNumber.mjs";
import {validateObject   } from "./validateObject.mjs";
import {validateRecord   } from "./validateRecord.mjs";
import {validateSet      } from "./validateSet.mjs";
import {validateTuple    } from "./validateTuple.mjs";
import {validateTypedef  } from "./validateTypedef.mjs";
import {validateUnion    } from "./validateUnion.mjs";
let enabled = true;
export function disableTypeChecking() {
  enabled = false;
}
export function enableTypeChecking() {
  enabled = true;
}
/**
 * @param {*} value - The actual value which we need to check.
 * @param {object} expect - Can also be a string, but string|object is unsupported in VSCode
 * @param {string} expect.type - Something like 'string', 'number', 'object', 'MeshInstance' etc.
 * @param {boolean} expect.optional - Is it an optional argument?
 * @param {object} [expect.properties] - Extra information for `expect.type === 'object'`.
 * @param {string} [expect.key] - Extra information for `expect.type === 'record'`.
 * @param {any} [expect.val] - Extra information for `expect.type === 'record'`, same
 * type as "expect".
 * @param {any[]} [expect.elements] - Extra information for `expect.type === 'record'`, same
 * type as "expect".
 * @param {any[]} [expect.elementType] - Extra information for array/class.
 * @todo Split array/class.
 * @param {string} loc - String like `BoundingBox#compute`
 * @param {string} name - Name of the argument.
 * @param {boolean} critical - Only false for unions.
 * @param {console["warn"]} warn - Function to warn with.
 * @returns {boolean} Returns wether `value` is in the shape of `expect`.
 */
function validateType(value, expect, loc, name, critical = true, warn) {
  if (!enabled) {
    return true;
  }
  if (!(expect instanceof Object)) {
    expect = {
      type: expect,
      optional: false
    };
  }
  const {type, optional, properties} = expect;
  if (optional) {
    if (value === undefined) {
      return true;
    }
    // Allow `null` for optional, because engine doesn't support strictNullChecks yet.
    if (value === null) {
      return true;
    }
  }
  const customCheck = customTypes[type];
  if (customCheck) {
    return customCheck(value);
  }
  if (typeof type === 'number' || typeof type === 'boolean') {
    const ret = value === type;
    if (!ret) {
      const what = typeof type;
      warn(`Expected literal ${what}.`, {value, expect});
    }
    return ret;
  }
  if (type === "undefined") {
    return value === undefined;
  }
  if (typeof value === 'number') {
    if (isNaN(value)) {
      warn("value is NaN");
      return false;
    }
    if (!isFinite(value)) {
      warn("value is +-infinite");
      return false;
    }
  }
  for (const customValidation of customValidations) {
    /** @type {any[]} */
    const warnings = [];
    /** @type {typeof warn} */
    const pushWarning = (...args) => {
      warnings.push(...args);
    };
    const ret = customValidation(value, expect, loc, name, critical, pushWarning);
    if (!ret) {
      warn(`Custom validation failed due to:`, ...warnings);
      return false;
    }
  }
  if (type === "object") {
    return validateObject(value, properties, loc, name, critical, warn);
  }
  if (type === 'record') {
    return validateRecord(value, expect, loc, name, critical, warn);
  }
  if (type === 'map') {
    return validateMap(value, expect, loc, name, critical, warn);
  }
  if (type === 'array') {
    return validateArray(value, expect, loc, name, critical, warn);
  }
  if (type === 'keyof') {
    return validateKeyof(value, expect, loc, name, critical, warn);
  }
  // If a typedef is also a class, it's just a shorthand-typedef-class
  if (typedefs[type] && !classes[type]) {
    return validateTypedef(value, expect, loc, name, critical, warn);
  }
  if (type === 'union') {
    return validateUnion(value, expect, loc, name, critical, warn);
  }
  if (type === 'set') {
    return validateSet(value, expect, loc, name, critical, warn);
  }
  // Trigger: pc.app.scene.setSkybox([1, 2, 3]);
  if (type === 'tuple') {
    return validateTuple(value, expect, loc, name, critical, warn);
  }
  if (type === '*' || type === 'any') {
    return true;
  }
  /** @todo allow strict/non-strict null/undefined with checkbox in <div> */
  if (type === 'null') {
    return value === null;
  }
  /** @todo add unit-tests/asserts tests to make sure this never happens */
  if (value === null) {
    // type !== null already, so this can only be false
    return false;
  }
  /** @todo use validateNumber() */
  if (type === 'number') {
    if (Number.isNaN(value)) {
      return false;
    }
    return typeof value === type;
  }
  if (type === 'string' || type === 'boolean') {
    return typeof value === type;
  }
  if (type[0] === '"' && type[type.length - 1] === '"') {
    const typeSlice = type.slice(1, -1);
    return value === typeSlice;
  }
  if (type[0] === "'" && type[type.length - 1] === "'") {
    const typeSlice = type.slice(1, -1);
    return value === typeSlice;
  }
  /** @todo Callback is PC specific, parse JSDoc callback types like typedefs */
  if (type === 'Function' || type === 'function' || type.includes('Callback')) {
    return typeof value === "function";
  }
  if (type === 'ObjectConstructor') {
    return typeof value.constructor === 'function';
  }
  if (type === 'class') {
    if (value && expect.elementType === 'ScriptType') {
      if (value.name === 'scriptType') {
        return true;
      }
      const proto = Object.getPrototypeOf(value);
      if (proto?.name === 'ScriptType') {
        return true;
      }
    }
    warn(`${loc}> validateType> class> expected object, not '${value}'`);
    return false;
  }
  if (type === 'ResourceHandler') {
    return value?.constructor?.name.endsWith('Handler');
  }
  // Camera, Float32Array etc.
  if (value && value.constructor && value.constructor.name === type) {
    return true;
  }
  if (typeof window !== 'undefined') {
    const windowClass = window[type];
    if (windowClass) {
      return value instanceof windowClass;
    }
    if (type.startsWith('globalThis.')) {
      const innerType = type.slice(11);
      const windowClass = window[innerType];
      if (windowClass) {
        return value instanceof windowClass;
      }
    }
  }
  // inheritance check, allow Application for AppBase, allow Entity for GraphNode etc.
  if (classes[type]) {
    return value instanceof classes[type];
  }
  warn("unchecked", {value, type, loc, name});
  return false;
}
export {validateType};
