import {inspectType} from "./inspectType.js";
import {replaceType} from "./replaceType.js";
/**
 * Narrows a bare template parameter from the runtime value, e.g. `K` becomes
 * `"camera"` once `name` validated against its `ComponentName` constraint.
 * Only literals narrow: objects keep the declared constraint.
 * @param {*} value - The actual value that was validated.
 * @returns {string|number|boolean|undefined} Literal type or undefined.
 */
function literalOf(value) {
  if (typeof value === 'string') {
    return `"${value}"`;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
}
function inspectTypeWithTemplates(value, expect, loc, name, templates) {
  // console.log("old expect", expect);
  const bare = typeof expect === 'string' ? expect : undefined;
  for (const key in templates) {
    expect = replaceType(expect, key, templates[key], console.warn);
  }
  // console.log("new expect", expect);
  const ret = inspectType(value, expect, loc, name);
  if (ret && bare !== undefined && templates[bare] !== undefined) {
    const literal = literalOf(value);
    if (literal !== undefined) {
      templates[bare] = literal;
    }
  }
  // if (ret) {
    // Narrowing complex values (unions, objects) from the runtime value is
    // still future work; only literals narrow above. NoInfer integration
    // will also be a later PR.
  // }
  return ret;
}
export {inspectTypeWithTemplates};
