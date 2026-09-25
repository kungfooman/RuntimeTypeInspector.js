import {classes } from "./registerClass.js";
import {typedefs} from "./registerTypedef.js";
// Prototype enumeration is the expensive bit: once per constructor for its
// lifetime, never in a validation hot path. Harvested shapes (transpiled
// classes) never touch this map.
const methodShapes = new WeakMap();
/**
 * Finds the registered name of a constructor (identity, not `.name`, so
 * aliases and minification stay correct).
 * @param {Function} ctor - Constructor to look up.
 * @returns {string|undefined} Registered name or undefined.
 */
function registeredNameOf(ctor) {
  for (const name in classes) {
    if (classes[name] === ctor) {
      return name;
    }
  }
  return ctor?.name;
}
/**
 * Builds a shape from the prototype chain: methods as `Function`,
 * getter/setter pairs as writable `any`, getter-only as readonly `any`.
 * Only used for classes without a harvested shape.
 * @param {Function} ctor - Constructor whose chain to read.
 * @returns {object} Object shape with a properties map.
 */
function prototypeShape(ctor) {
  let shape = methodShapes.get(ctor);
  if (!shape) {
    const properties = {};
    let proto = ctor.prototype;
    const seen = new Set();
    while (proto && proto !== Object.prototype && !seen.has(proto)) {
      seen.add(proto);
      for (const key of Object.getOwnPropertyNames(proto)) {
        if (key === 'constructor' || key in properties) {
          continue;
        }
        const desc = Object.getOwnPropertyDescriptor(proto, key);
        if (!desc) {
          continue;
        }
        if (typeof desc.value === 'function') {
          properties[key] = 'Function';
        } else if (desc.get || desc.set) {
          properties[key] = desc.get && !desc.set ? {type: 'any', readonly: true} : 'any';
        } else if ('value' in desc) {
          properties[key] = 'any';
        }
      }
      proto = Object.getPrototypeOf(proto);
    }
    shape = {type: 'object', properties};
    methodShapes.set(ctor, shape);
  }
  return shape;
}
/**
 * Merges the harvested shapes up the constructor chain, base first so the
 * subclass wins. Levels without a harvested shape contribute their
 * prototype members (methods, accessors) instead.
 * @param {string} name - Registered class name.
 * @returns {object} Merged object shape with a properties map.
 */
function mergedClassShape(name) {
  const properties = {};
  let ctor = classes[name];
  const seen = new Set();
  const chain = [];
  while (ctor && typeof ctor === 'function' && !seen.has(ctor)) {
    seen.add(ctor);
    chain.push(ctor);
    const proto = Object.getPrototypeOf(ctor);
    if (!proto || proto === Function.prototype || proto === Function || proto === Object) {
      break;
    }
    ctor = proto;
  }
  for (let i = chain.length - 1; i >= 0; i--) {
    const shapeName = registeredNameOf(chain[i]);
    const harvested = shapeName && typedefs[shapeName];
    if (harvested && harvested.type === 'object' && harvested.properties) {
      Object.assign(properties, harvested.properties);
    } else {
      Object.assign(properties, prototypeShape(chain[i]).properties);
    }
  }
  return {type: 'object', properties};
}
export {mergedClassShape};
