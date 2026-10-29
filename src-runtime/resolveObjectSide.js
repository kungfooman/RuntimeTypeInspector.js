import {getTypeKeys} from './getTypeKeys.js';
import {instantiateReference} from './instantiateReference.js';
import {classes} from './registerClass.js';
import {typedefs} from './registerTypedef.js';
import {validators} from './validators.js';
import {mergedClassShape} from './classShape.js';
import {createTypeFromMapping} from './createTypeFromMapping.js';
import {materializeUtility} from './materializeUtility.js';
import {resolveObject} from './getTypeKeys.js';
/**
 * Resolves the object side of an indexed access to a property map.
 * Chases typedef names, instantiates generic references, materializes
 * mappings and utilities, and merges intersections/unions member-wise.
 * @param {*} object - Object side of the indexed access.
 * @param {console["warn"]} warn - Function to warn with.
 * @param {number} depth - Recursion depth.
 * @returns {import('./validateType.js').TypeObject|undefined} Object shape or undefined.
 * @example
 * // input: {type: 'object', properties: {a: 'K'}}
 * resolveObjectSide(expandType('{a: K}'), console.warn);
 * // {type: 'object', properties: {a: 'K'}}
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
export {resolveObjectSide};
