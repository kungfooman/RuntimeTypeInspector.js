import {substituteType} from "./substituteType.js";
import {typedefs, typedefTemplates} from "./registerTypedef.js";
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
  // Pure substitution never mutates its input, so the registry object is
  // substituted directly instead of cloned first (read-only downstream).
  let instance = typedefs[name];
  params.forEach((param, i) => {
    instance = substituteType(instance, param, i < args.length ? args[i] : 'any', warn);
  });
  return instance;
}
export {instantiateReference};
