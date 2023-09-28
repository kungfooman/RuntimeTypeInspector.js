import {assertType} from "./assertType.mjs";
import {typecheckEvery} from "./typecheckEvery.mjs";
import {typecheckOptions} from "./typecheckOptions.mjs";
import {typecheckWarn} from "./typecheckWarn.mjs";
import {validateNumber} from "./validateNumber.mjs";
import { validateObject } from "./validateObject.mjs";
// For quickly checking props of Vec2/Vec3/Vec4/Quat/Mat3/Mat4 without GC
const propsXY   = ['x', 'y'];
const propsXYZ  = ['x', 'y', 'z'];
const propsXYZW = ['x', 'y', 'z', 'w'];
const props9    = [0, 1, 2, 3, 4, 5, 6, 7, 8];
const props16   = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
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
 * @returns {boolean} - Returns wether `value` is in the shape of `expect`.
 */
function validateType(value, expect, loc, name, critical = true) {
  if (typeof expect === 'string') {
    expect = {
      type: expect,
      optional: false
    };
  }
  let { type } = expect;
  const { optional, properties } = expect;
  if (!type) {
    console.error('validateType> missing type');
    return false;
  }
  type = type.trim();
  if (optional) {
    if (value === undefined) {
      return true;
    }
    // Allow `null` for optional, because engine doesn't support strictNullChecks yet.
    if (value === null) {
      return true;
    }
  }
  const customCheck = typecheckOptions.customTypes[type];
  if (customCheck) {
    return customCheck(value);
  }
  if (type === "undefined") {
    return value === undefined;
  }
  if (typeof value === 'number') {
    if (isNaN(value)) {
      typecheckWarn("value is NaN");
      return false;
    }
    if (!isFinite(value)) {
      typecheckWarn("value is +-infinite");
      return false;
    }
  }
  if (window.pc) {
    /**
     * @param {string|number} prop - Something like 'x', 'y', 'z', 'w', 0, 1, 2, 3, 4 etc.
     * @returns {boolean} Wether prop is a valid number.
     */
    const checkProp = (prop) => {
      return validateNumber(value, prop);
    };
    if (value instanceof pc.Vec2) {
      return propsXY.every(checkProp);
    }
    if (value instanceof pc.Vec3) {
      return propsXYZ.every(checkProp);
    }
    if (value instanceof pc.Vec4 || value instanceof pc.Quat) {
      return propsXYZW.every(checkProp);
    }
    if (value instanceof pc.Mat3) {
      return props9.every(prop => validateNumber(value.data, prop));
    }
    if (value instanceof pc.Mat4) {
      return props16.every(prop => validateNumber(value.data, prop));
    }
  }
  if (type === "object") {
    return validateObject(value, properties, loc, name, critical);
  }
  if (type === 'record') {
    return validateRecord(value, expect, loc, name, critical);
  }
  // todo: work out tests
  if (type === 'map') {
    const { key, val } = expect;
    if (key !== 'string') {
      typecheckWarn(`${loc}> validateType> map> unhandled key '${key}'`);
      return false;
    }
    if (val !== 'any') {
      typecheckWarn(`${loc}> validateType> map> expected any, not '${value}'`);
      return false;
    }
    let ret = true;
    for (const [k, v] of value) {
      const good = assertType(
        v,
        val,
        loc,
        `${name}.get('${key}')`,
        critical
      );
      if (!good) {
        ret = false;
      }
    }
    return ret;
  }
  // Test: ???
  if (type === 'array') {
    if (value && value instanceof Array) {
      const { elementType } = expect;
      // some that not validate -> type error
      return typecheckEvery(value, (_, i) => assertType(
        _,
        elementType,
        loc,
        `${name}[${i}]`,
        critical
      ));
    }
    // if it's not even an array -> type error
    return false;
  }
  // Test unions: ???
  if (type === 'union') {
    return expect.members.some(member => assertType(
      value,
      member,
      loc,
      name + ` union type: ${member?.type || member}`,
      false
    ));
  }
  // Trigger: pc.app.scene.setSkybox([1, 2, 3]);
  if (type === 'tuple') {
    if (!value) {
      return false;
    }
    if (!(value instanceof Array)) {
      return false;
    }
    const { elements } = expect;
    return elements.every((element, i) => {
      return assertType(
        value[i],
        element,
        loc,
        `${name}[${i}]`,
        critical
      );
    });
  }
  if (type === '*' || type === 'any') {
    return true;
  }
  if (type === 'null') {
    return value === null;
  }
  if (value === null) {
    // type !== null already, so this can only be false
    return false;
  }
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
    typecheckWarn(`${loc}> validateType> class> expected object, not '${value}'`);
    return false;
  }
  if (type === 'ResourceHandler') {
    return value?.constructor?.name.endsWith('Handler');
  }
  // Camera, Float32Array etc.
  if (value && value.constructor && value.constructor.name === type) {
    return true;
  }
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
  // inheritance check, allow Application for AppBase, allow Entity for GraphNode etc.
  if (typeof pc !== "undefined") {
    const pcVal = pc[type];
    if (pcVal !== undefined) {
      if (typeof pcVal === 'function') {
        return value instanceof pcVal;
      } else if (typeof pcVal === 'number' || typeof pcVal === 'string') {
        return value === pcVal;
      }
      typecheckWarn('unhandled pc member', { value, type, expect, pcVal });
      return false;
    }
  }
  typecheckWarn("unchecked", { value, type, loc, name });
  return false;
}
export {validateType};
