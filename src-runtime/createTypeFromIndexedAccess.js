import {getTypeKeys, instantiateReference, resolveObject, stripKey} from "./getTypeKeys.js";
import {classes} from "./registerClass.js";
import {typedefs} from "./registerTypedef.js";
import {validators} from "./validators.js";
import {mergedClassShape} from "./classShape.js";
import {createTypeFromMapping} from "./createTypeFromMapping.js";
/**
 * Materializes Pick/Omit/Partial to object shapes for indexed access.
 * Unresolvable bases or key lists yield undefined (callers fail closed).
 * @param {*} target - Utility reference struct.
 * @param {console["warn"]} warn - Function to warn with.
 * @param {number} depth - Recursion depth.
 * @returns {import('./validateType.js').TypeObject|undefined} Object shape or undefined.
 */
function materializeUtility(target, warn, depth) {
  const [base, keys] = target.args ?? [];
  if (target.name === 'Partial') {
    const resolved = base === undefined ? undefined : resolveObjectSide(base, warn, depth + 1);
    if (!resolved || !resolved.properties) {
      return;
    }
    const properties = {};
    for (const key of Object.keys(resolved.properties)) {
      const prop = resolved.properties[key];
      properties[key] = prop && typeof prop === 'object' ? {...prop, optional: true} : {type: prop, optional: true};
    }
    return {type: 'object', properties};
  }
  if (base === undefined || keys === undefined) {
    return;
  }
  const resolved = resolveObjectSide(base, warn, depth + 1);
  if (!resolved || !resolved.properties) {
    return;
  }
  const names = getTypeKeys(keys, warn);
  if (!Array.isArray(names)) {
    return;
  }
  const wanted = new Set(names.map((name) => stripKey(name)));
  const properties = {};
  for (const key of Object.keys(resolved.properties)) {
    if (wanted.has(key) === (target.name === 'Pick')) {
      properties[key] = resolved.properties[key];
    }
  }
  return {type: 'object', properties};
}
/**
 * Resolves the object side of an indexed access to a property map.
 * Chases typedef names, instantiates generic references, materializes
 * mappings and utilities, and merges intersections/unions member-wise.
 * @param {*} object - Object side of the indexed access.
 * @param {console["warn"]} warn - Function to warn with.
 * @param {number} depth - Recursion depth.
 * @returns {import('./validateType.js').TypeObject|undefined} Object shape or undefined.
 */
function resolveObjectSide(object, warn, depth = 0) {
  if (depth > 10) {
    return;
  }
  let target = object;
  for (let i = 0; i < 10; i++) {
    if (typeof target === 'string') {
      // Class names merge harvested shapes up the constructor chain; plain
      // typedef names resolve straight to their shape.
      if (classes[target]) {
        target = mergedClassShape(target);
        continue;
      }
      if (typedefs[target]) {
        target = typedefs[target];
        continue;
      }
      break;
    }
    if (target && target.type === 'reference') {
      if ((target.name === 'NonNullable' || target.name === 'Readonly' || target.name === 'NoInfer') && target.args?.length) {
        return resolveObjectSide(target.args[0], warn, depth + 1);
      }
      if (target.name === 'Pick' || target.name === 'Omit' || target.name === 'Partial') {
        return materializeUtility(target, warn, depth);
      }
      if (typedefs[target.name]) {
        const instance = instantiateReference(target, warn);
        if (!instance || instance === target) {
          break;
        }
        target = instance;
        continue;
      }
    }
    break;
  }
  if (!target || typeof target !== 'object') {
    return;
  }
  if (target.type === 'object') {
    return target.properties ? target : {type: 'object', properties: {}};
  }
  if (target.type === undefined) {
    // Bare `{}` (e.g. a conditional false-branch) is the empty object type.
    return {type: 'object', properties: target.properties ?? {}};
  }
  if (target.type === 'mapping') {
    return createTypeFromMapping(target, warn) ?? undefined;
  }
  if ((target.type === 'intersection' || target.type === 'union') && Array.isArray(target.members)) {
    const properties = {};
    for (const member of target.members) {
      const resolved = resolveObjectSide(member, warn, depth + 1);
      if (!resolved || !resolved.properties) {
        return;
      }
      Object.assign(properties, resolved.properties);
    }
    return {type: 'object', properties};
  }
  if (target.type === 'indexedAccess') {
    return resolveObject(target, warn);
  }
  if (target.type === 'condition') {
    const evaluate = validators.evaluateCondition;
    if (!evaluate) {
      return;
    }
    const decision = evaluate(target.checkType, target.extendsType, warn);
    if (decision === true) {
      return resolveObjectSide(target.trueType, warn, depth + 1);
    }
    if (decision === false) {
      return resolveObjectSide(target.falseType, warn, depth + 1);
    }
  }
}
/**
 * @param {import('./validateIndexedAccess.js').IndexedAccess} expect - The supposed type information of said value.
 * @param {console["warn"]} warn - Function to warn with.
 * @returns {import('./validateType.js').TypeObject|undefined} - New type that can be used for validation.
 */
function createTypeFromIndexedAccess(expect, warn) {
  const {object, index} = expect;
  const resolvedObject = resolveObjectSide(object, warn);
  if (!resolvedObject || !resolvedObject.properties) {
    warn('validateIndexedAccess: unresolvable indexed access', {expect});
    return;
  }
  const indexKeys = getTypeKeys(index, warn);
  //console.log("createTypeFromIndexedAccess", {resolvedObject, object, index, indexKeys});
  if (!indexKeys) {
    warn('createTypeFromIndexedAccess: missing indexKeys');
    return;
  }
  /** @type {import('./validateType.js').Type[]} */
  const members = [];
  for (const indexKey of indexKeys) {
    const prop = resolvedObject.properties[stripKey(indexKey)];
    if (prop === undefined) {
      continue;
    }
    // NB: quoted literals stay quoted, they are types: '"x"' validates
    // the value 'x', while bare 'x' would warn unchecked and always fail.
    members.push(prop);
  }
  if (!members.length) {
    warn('validateIndexedAccess: unresolvable indexed access', {expect});
    return;
  }
  return {type: 'union', members, optional: false};
}
export {createTypeFromIndexedAccess};
