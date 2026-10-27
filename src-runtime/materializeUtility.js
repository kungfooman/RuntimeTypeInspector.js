import {getTypeKeys} from './getTypeKeys.js';
import {instantiateReference} from './instantiateReference.js';
import {stripKey} from './stripKey.js';
import {resolveObjectSide} from './resolveObjectSide.js';
/**
 * Materializes Pick/Omit/Partial to object shapes for indexed access.
 * Unresolvable bases or key lists yield undefined (callers fail closed).
 * @param {*} target - Utility reference struct.
 * @param {console["warn"]} warn - Function to warn with.
 * @param {number} depth - Recursion depth.
 * @returns {import('./validateType.js').TypeObject|undefined} Object shape or undefined.
 * @example
 * // input: {type: 'reference', name: 'Pick', args: [{type: 'object', properties: {a: 'K', b: 'number'}}, '"a"']}
 * materializeUtility(expandType('Pick<{a: K, b: number}, "a">'), console.warn, 0);
 * // {type: 'object', properties: {a: 'K'}}
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
export {materializeUtility};
