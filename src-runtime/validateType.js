import {customTypes         } from "./customTypes.js";
import {customValidations   } from "./customValidations.js";
import {classes             } from "./registerClass.js";
import {typedefs            } from "./registerTypedef.js";
import {validateArray       } from "./validateArray.js";
import {validateIntersection} from "./validateIntersection.js";
import {validateKeyof       } from "./validateKeyof.js";
import {validateMap         } from "./validateMap.js";
import {validateMapping     } from "./validateMapping.js";
import {validateNumber      } from "./validateNumber.js";
import {validateObject      } from "./validateObject.js";
import {validateRecord      } from "./validateRecord.js";
import {validateSet         } from "./validateSet.js";
import {validateTuple       } from "./validateTuple.js";
import {validateTypedef     } from "./validateTypedef.js";
import {validateUnion       } from "./validateUnion.js";
export let enabled = true;
export function disableTypeChecking() {
  enabled = false;
}
export function enableTypeChecking() {
  enabled = true;
}
/**
 * @typedef {object} TypeObject
 * @property {string} type - Something like 'string', 'number', 'object', 'MeshInstance' etc.
 * @property {boolean} optional - Is it an optional argument?
 * @property {object} [properties] - Extra information for `expect.type === 'object'`.
 * @property {string} [key] - Extra information for `expect.type === 'record'`.
 * @property {any} [val] - Extra information for `expect.type === 'record'`, same
 * type as "expect".
 * @property {any[]} [elements] - Extra information for `expect.type === 'record'`, same
 * type as "expect".
 * @property {any[]} [elementType] - Extra information for array/class.
 * @property {any[]} [members] - Extra information for union.
 */
/**
 * @typedef {string|TypeObject} Type
 */
/**
 * @param {*} value - The actual value which we need to check.
 * @param {Type} expect - Expected type structure.
 * @todo Split array/class.
 * @param {string} loc - String like `BoundingBox#compute`
 * @param {string} name - Name of the argument.
 * @param {boolean} critical - Only false for unions.
 * @param {console["warn"]} warn - Function to warn with.
 * @param {number} depth - The depth to detect recursion.
 * @returns {boolean} Returns wether `value` is in the shape of `expect`.
 */
function validateType(value, expect, loc, name, critical = true, warn, depth) {
  if (!enabled) {
    return true;
  }
  if (depth > 16) {
    warn('Exceeded recursive depth limit.');
    return false;
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
    const ret = customValidation(value, expect, loc, name, critical, pushWarning, depth + 1);
    if (!ret) {
      warn(`Custom validation failed due to:`, ...warnings);
      return false;
    }
  }
  if (typedefs[type] && !classes[type]) {
    // If a typedef is also a class, it's just a shorthand-typedef-class
    return validateTypedef(value, expect, loc, name, critical, warn, depth + 1);
  }
  switch (type) {
    case 'undefined':
      return value === undefined;
    case 'object':
      return validateObject(value, properties, loc, name, critical, warn, depth + 1);
    case 'record':
      return validateRecord(value, expect, loc, name, critical, warn, depth + 1);
    case 'map':
      return validateMap(value, expect, loc, name, critical, warn, depth + 1);
    case 'mapping':
      return validateMapping(value, expect, loc, name, critical, warn, depth + 1);
    case 'array':
      return validateArray(value, expect, loc, name, critical, warn, depth + 1);
    case 'intersection':
      return validateIntersection(value, expect, loc, name, critical, warn, depth + 1);
    case 'keyof':
      return validateKeyof(value, expect, loc, name, critical, warn, depth + 1);
    case 'union':
      return validateUnion(value, expect, loc, name, critical, warn, depth + 1);
    case 'set':
      return validateSet(value, expect, loc, name, critical, warn, depth + 1);
    case 'tuple':
      // Trigger: pc.app.scene.setSkybox([1, 2, 3]);
      return validateTuple(value, expect, loc, name, critical, warn, depth + 1);
    case '*':
    case 'any':
      return true;
    case 'null':
      /** @todo allow strict/non-strict null/undefined with checkbox in <div> */
      return value === null;
    case 'number':
      /** @todo use validateNumber() */
      if (Number.isNaN(value)) {
        return false;
      }
      return typeof value === type;
    case 'string':
    case 'boolean':
      return typeof value === type;
    case 'Function':
    case 'function':
    case 'new':
      return typeof value === 'function';
    case 'ObjectConstructor':
      return typeof value.constructor === 'function';
    case 'class':
      /** @todo PlayCanvas specific, move into custom validations */
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
    case 'IArguments':
      // Used in playcanvas-engine/src/core/tags.js
      // Testable via physics/offset-collision example.
      return value[Symbol.iterator] instanceof Function;
    case 'ArrayBufferView':
      return ArrayBuffer.isView(value);
    }
  }
  //if (value === null) {
  //  /** @todo Add unit-tests/asserts tests to make sure this never happens */
  //  console.warn('type !== null already, so this can only be false');
  //  return false;
  //} else
  if (type[0] === '"' && type[type.length - 1] === '"') {
    const typeSlice = type.slice(1, -1);
    return value === typeSlice;
  } else if (type[0] === "'" && type[type.length - 1] === "'") {
    const typeSlice = type.slice(1, -1);
    return value === typeSlice;
  } else if (value && value.constructor && value.constructor.name === type) {
    // Camera, Float32Array etc.
    return true;
  } else if (classes[type]) {
    // Inheritance check, allow Application for AppBase, allow Entity for GraphNode etc.
    return value instanceof classes[type];
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
  warn('unchecked', {value, type, loc, name});
  return false;
}
export {validateType};
