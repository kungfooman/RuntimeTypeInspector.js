import {customTypes         } from "./customTypes.js";
import {customValidations   } from "./customValidations.js";
import {options             } from "./options.js";
import {classes             } from "./registerClass.js";
import {typedefs            } from "./registerTypedef.js";
import {validateArray       } from "./validateArray.js";
import {validateArrayLike   } from "./validateArrayLike.js";
import {validateIntersection} from "./validateIntersection.js";
import {validateIndexedAccess} from "./validateIndexedAccess.js";
import {validateKeyof       } from "./validateKeyof.js";
import {validateMap         } from "./validateMap.js";
import {validateMapping     } from "./validateMapping.js";
import {validateNumber      } from "./validateNumber.js";
import {validateObject      } from "./validateObject.js";
import {validatePromise     } from "./validatePromise.js";
import {validateRecord      } from "./validateRecord.js";
import {validateReference   } from "./validateReference.js";
import {validateSet         } from "./validateSet.js";
import {validateTemplateLiteral} from "./validateTemplateLiteral.js";
import {validateTuple       } from "./validateTuple.js";
import {validateTypeof      } from "./validateTypeof.js";
import {validateTypedef     } from "./validateTypedef.js";
import {validateUnion       } from "./validateUnion.js";
import {validators          } from "./validators.js";
/**
 * Populates the dispatch table: every edge points outward from here, so the
 * module graph stays acyclic. Importing this module (or the package index)
 * guarantees a full table. Shorthand keys mirror the export names.
 */
Object.assign(validators, {
  validateType,
  validateObject,
  validateRecord,
  validateReference,
  validateMap,
  validateMapping,
  validateArray,
  validateIntersection,
  validateIndexedAccess,
  validateKeyof,
  validateUnion,
  validateSet,
  validateTemplateLiteral,
  validateTuple,
  validateTypeof,
  validateNumber,
  validatePromise,
  validateArrayLike,
  validateTypedef,
});
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
  if (depth > 16) {
    warn('Exceeded recursive depth limit.');
    return false;
  }
  if (!options.strictNullChecks && (value === null || value === undefined)) {
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
    return validators.validateTypedef(value, expect, loc, name, critical, warn, depth + 1);
  }
  switch (type) {
    case 'undefined':
      return value === undefined;
    case 'object':
      return validators.validateObject(value, properties, loc, name, critical, warn, depth + 1);
    case 'promise':
      return validators.validatePromise(value, expect, loc, name, critical, warn, depth + 1);
    case 'record':
      return validators.validateRecord(value, expect, loc, name, critical, warn, depth + 1);
    case 'reference':
      return validators.validateReference(value, expect, loc, name, critical, warn, depth + 1);
    case 'map':
      return validators.validateMap(value, expect, loc, name, critical, warn, depth + 1);
    case 'mapping':
      return validators.validateMapping(value, expect, loc, name, critical, warn, depth + 1);
    case 'array':
      return validators.validateArray(value, expect, loc, name, critical, warn, depth + 1);
    case 'intersection':
      return validators.validateIntersection(value, expect, loc, name, critical, warn, depth + 1);
    case 'indexedAccess':
      return validators.validateIndexedAccess(value, expect, loc, name, critical, warn, depth + 1);
    case 'keyof':
      return validators.validateKeyof(value, expect, loc, name, critical, warn, depth + 1);
    case 'union':
      return validators.validateUnion(value, expect, loc, name, critical, warn, depth + 1);
    case 'set':
      return validators.validateSet(value, expect, loc, name, critical, warn, depth + 1);
    case 'templateLiteral':
      return validators.validateTemplateLiteral(value, expect, loc, name, critical, warn, depth + 1);
    case 'tuple':
      // Trigger: pc.app.scene.setSkybox([1, 2, 3]);
      return validators.validateTuple(value, expect, loc, name, critical, warn, depth + 1);
    case 'typeof':
      return validators.validateTypeof(value, expect, loc, name, critical, warn, depth + 1);
    case '*':
    case 'any':
      return true;
    case 'null':
      return value === null;
    case 'number':
      return validators.validateNumber(value, expect, loc, name, critical, warn, depth + 1);
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
      /** @todo unit tests */
      return value[Symbol.iterator] instanceof Function;
    case 'ArrayBufferView':
      /**
       * @todo unit tests + TS Lib object like customObjects...
       * for e.g. different TS versions or environments
       */
      return ArrayBuffer.isView(value);
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
