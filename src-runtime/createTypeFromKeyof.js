import {resolveType} from "./resolveType.js";
/**
 * @todo reuse this function in createTypeFromMapping/getTypeKeys
 * @param {import('./validateKeyof.mjs').Keyof} expect - The supposed type information of said value.
 * @param {console["warn"]} warn - Function to warn with.
 * @returns {import('./validateType.mjs').TypeObject|undefined} - New type that can be used for validatoin
 */
function createTypeFromKeyof(expect, warn) {
  const {argument} = expect;
  const object = resolveType(argument, 'object', warn);
  if (object) {
    const optional = false;
    const members = Object.keys(object.properties);
    return {type: 'union', optional, members};
  }
  warn('createTypeFromKeyof: unhandled type.', {expect});
}
export {createTypeFromKeyof};
