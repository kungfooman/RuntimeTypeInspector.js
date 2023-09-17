import {expandTypeDepFree} from "./expandTypeDepFree.mjs";
import {simplifyType} from "./simplifyType.mjs";
/**
 * @param {string} str - The type.
 * @returns {string} The type with stripped default value.
 */
function stripDefaultValue(str) {
  return str.split("=")[0];
}
/**
 * @param {string} str - The type.
 * @returns {boolean} Whether the type is optional or not.
 */
function isOptional(str) {
  return str[0] === '[' && str[str.length - 1] === ']';
}
/**
 * @param {string} str - The type.
 * @returns {string}
 */
function stripOptional(str) {
  if (isOptional(str)) {
    str = str.slice(1, -1);
  }
  return str;
}
/**
 * @param {string} src 
 * @returns {{} | undefined}
 */
function parseJSDoc(src, expandType = expandTypeDepFree) {
  const regex = /@param \{(.*?)\} ([\[\]a-zA-Z0-9_$=\.' ]+)/g;
  const matches = [...src.matchAll(regex)];
  /** @type {Record<string, any>} */
  const params = Object.create(null);
  matches.forEach(_ => {
    const type = expandType(_[1].trim());
    let name = _[2].split(' ')[0].trim(); // If people don't use a dash, we need to strip the rest (which is the description).
    const optional = isOptional(name);
    const simplifiedType = simplifyType(type, optional);
    name = stripDefaultValue(stripOptional(name)).trim();
    const parts = name.split(".");
    if (parts.length == 3) { // Something like: @param {number[]} settings.render.skyboxRotation - Rotation of skybox.
      let parts0 = parts[0]; // settings
      let parts1 = parts[1]; // render
      let parts2 = parts[2]; // skyboxRotation
      const toptype = params[parts0];
      toptype.properties[parts1].properties = toptype.properties[parts1].properties || {};
      toptype.properties[parts1].properties[parts2] = simplifiedType;
    } else if (parts.length == 2) { // Something like: @param {number} description[].components
      let parts0 = parts[0]; // description[]
      let parts1 = parts[1]; // components
      if (parts0.endsWith('[]')) {
        parts0 = parts0.slice(0, -2); // description[] -> description
      }
      const toptype = params[parts0];
      if (toptype?.type == "union") {
        const typeObject = toptype.members.find(_ => _?.type == 'object');
        typeObject.properties[parts1] = simplifiedType;
      } else if (toptype?.type == "array") {
        toptype.elementType.properties[parts1] = simplifiedType;
      } else if (toptype?.type == "object") {
        toptype.properties = toptype.properties || {};
        toptype.properties[parts1] = simplifiedType;
      } else {
        console.warn("parseJSDoc> skipping @param, unseen syntax detected, please check if your JSDoc is valid or open an issue about this", {
          src, toptype, parts0, parts1, simplifiedType
        })
      }
    } else {
      params[name] = simplifiedType;
    }
  });
  if (Object.keys(params).length === 0) {
    return;
  }
  return params;
}
export {stripDefaultValue, isOptional, stripOptional, parseJSDoc};
