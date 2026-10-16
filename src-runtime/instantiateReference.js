import {substituteType} from "./substituteType.js";
import {typedefs, typedefTemplates, typedefVersion} from "./registerTypedef.js";
import {classVersion} from "./registerClass.js";
import {deepFreeze} from "./deepFreeze.js";
import {canonicalKey} from "./canonicalKey.js";
// Instantiated generic typedefs by name plus canonical arguments: e.g.
// `ComponentOptions<"element">` depends only on its argument, not on the
// checked value, so 260 `addComponent('element', …)` calls share one
// instantiation instead of substituting the whole tower per call. Entries
// carry the registry versions they were derived under, so re-registration
// recomputes instead of serving stale shapes. Frozen once: validation is
// read-only over expects. Unserializable args skip the cache (computed
// directly) rather than failing.
const referenceInstances = new Map();
/**
 * Instantiates a generic typedef reference by substituting arguments for
 * template parameters. Shared by reference resolution paths.
 * @param {object} type - Reference with name and args.
 * @param {console["warn"]} warn - Function to warn with.
 * @returns {object|undefined} Instantiated struct or undefined when N/A.
 * @example
 * registerTypedef('Box', {type: 'object', properties: {value: 'T'}}, ['T']);
 * instantiateReference({name: 'Box', args: ['"a"']}, console.warn);
 * // {type: 'object', properties: {value: '"a"'}}
 */
function instantiateReference(type, warn) {
  const {name, args} = type;
  if (!typedefs[name]) {
    return;
  }
  const params = typedefTemplates[name];
  if (!params?.length || !args?.length) {
    return typedefs[name];
  }
  let key;
  const argsKey = canonicalKey(args);
  if (argsKey !== undefined) {
    key = `${name}\n${argsKey}`;
  } else {
    key = undefined;
  }
  if (key !== undefined) {
    const cached = referenceInstances.get(key);
    if (cached && cached.typedefV === typedefVersion && cached.classV === classVersion) {
      return cached.instance;
    }
  }
  // Pure substitution never mutates its input, so the registry object is
  // substituted directly instead of cloned first (read-only downstream).
  let instance = typedefs[name];
  params.forEach((param, i) => {
    instance = substituteType(instance, param, i < args.length ? args[i] : 'any', warn);
  });
  instance = deepFreeze(instance);
  if (key !== undefined) {
    referenceInstances.set(key, {typedefV: typedefVersion, classV: classVersion, instance});
  }
  return instance;
}
export {instantiateReference};
