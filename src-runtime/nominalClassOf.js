import {typedefs} from "./registerTypedef.js";
import {classes} from "./registerClass.js";
/**
 * Registered constructor behind a type name, following typedef aliases to
 * it. Class names win over same-named typedefs (harvested shapes share the
 * name), mirroring how validation prefers nominal checks for classes.
 * @param {*} type - Type name or node to resolve.
 * @returns {Function|undefined} Constructor or undefined when not a class.
 * @example
 * nominalClassOf('Color', console.warn);
 * // classes['Color'] when registered, otherwise undefined
 */
function nominalClassOf(type) {
  let current = type;
  for (let i = 0; i < 10 && typeof current === 'string'; i++) {
    if (classes[current]) {
      return classes[current];
    }
    if (!typedefs[current]) {
      return undefined;
    }
    current = typedefs[current];
  }
  return undefined;
}
export {nominalClassOf};
