import {recurse} from "./validators.js";
import {options} from "./options.js";
import {classes} from "./registerClass.js";
import {resolveObject} from "./getTypeKeys.js";
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
function validateIntersection(value, expect, loc, name, critical, warn, depth) {
  const {members} = expect;
  // console.log('validateIntersection', {value, expect, loc, name, critical, warn});
  // Per-member excess would reject keys sibling members declare (the
  // `Omit<Base, Keys> & Overrides` idiom: the Omit side omits `anchor`
  // exactly because the override side provides it). Validate each member
  // against its resolved shape augmented with siblings' props as
  // optional, so `exactObjects` judges excess against the whole
  // intersection like tsc does. Only when every member resolves to a
  // plain object shape and no raw member is a class name (nominal
  // instanceof verdicts must not degrade to structural ones);
  // otherwise keep today's per-member behavior instead of guessing.
  let checking = members;
  if (options.exactObjects === true && value !== null && typeof value === 'object' && !Array.isArray(value) &&
    members.every((member) => !(typeof member === 'string' && classes[member]))) {
    const shapes = members.map((member) => resolveObject(member, warn, depth + 1));
    if (shapes.every((shape) => shape && shape.type === 'object' && shape.properties)) {
      checking = shapes.map((shape, i) => {
        const extra = {};
        for (const [j, other] of shapes.entries()) {
          if (j === i) {
            continue;
          }
          for (const key of Object.keys(other.properties)) {
            if (!(key in shape.properties)) {
              const prop = other.properties[key];
              extra[key] = prop && typeof prop === 'object' ? {...prop, optional: true} : {type: prop, optional: true};
            }
          }
        }
        if (!Object.keys(extra).length) {
          return shape;
        }
        return {...shape, properties: {...shape.properties, ...extra}};
      });
    }
  }
  for (const member of checking) {
    const good = recurse(value, member, loc, name, critical, warn, depth + 1);
    if (!good) {
      warn(`Doesn't match intersection member.`, {member});
      return false;
    }
  }
  return true;
}
export {validateIntersection};
