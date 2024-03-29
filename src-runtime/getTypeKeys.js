import {variables} from "./registerVariable.js";
import {typedefs } from "./registerTypedef.js";
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
  if (typeof expect === 'string') {
    if (typedefs[expect]) {
      const typedef = typedefs[expect];
      return getTypeKeys(typedef, warn);
      //warn("getTypeKeys: Unhandled typedef", {expect, typedef});
      //return;
    }
    warn("getTypeKeys> 'expect' was a string but not a typedef, unhandled case.");
    return;
  }
  const {type} = expect;
  if (type === 'typeof') {
    const varName = expect.argument;
    const variable = variables[varName];
    if (variable === undefined) {
      warn(`Can't find variable named '${varName}'.`);
      return;
    }
    return Object.keys(variable);
  } else if (type === 'union') {
    return expect.members;
  } else if (type === 'object') {
    return Object.keys(expect.properties);
  } else if (type === 'keyof') {
    const {argument} = expect;
    //console.log("want key for", argument);
    return getTypeKeys(argument, warn);
  } else if (type === 'indexedAccess') {
    const {index} = expect;
    let {object} = expect;
    // todo replace with resolveType
    if (typeof object === 'string' && typedefs[object]) {
      object = typedefs[object];
    }
    const indexKeys = getTypeKeys(index, warn);
    const arr = [];
    for (const indexKey of indexKeys) {
      arr.push(object.properties[indexKey]);
    }
    // console.log({object, index, indexKeys, arr});
    return arr;
  }
  warn(`Couldn't get keys for type`, expect);
}
export {getTypeKeys};
