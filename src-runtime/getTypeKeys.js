import {variables} from "./registerVariable.js";
import {typedefs } from "./registerTypedef.mjs";
/**
 * @example
 * getTypeKeys({type: 'typeof', argument: 'DataTypeMap'}, console.warn);
 * // Or simpler:
 * getTypeKeys(expandType("typeof DataTypeMap"));
 * getTypeKeys(expandType("1|2|3"));
 * @param {*} expect - The type.
 * @param {console["warn"]} warn - Function to warn with.
 * @returns {string[]|undefined} Keys or undefined.
 */
function getTypeKeys(expect, warn) {
  if (expect?.type === 'typeof') {
    const varName = expect.argument;
    const variable = variables[varName];
    if (variable === undefined) {
      warn(`Can't find variable named '${varName}'.`);
      return;
    }
    return Object.keys(variable);
  } else if (typedefs[expect]) {
    const typedef = typedefs[expect];
    if (typedef.type === 'union') {
      return typedef.members;
    }
    warn("getTypeKeys: Unhandled typedef", {expect, typedef});
  }
  warn(`Couldn't get keys for type`, expect);
}
export {getTypeKeys};
