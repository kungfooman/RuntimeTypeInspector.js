import {expandTypeDepFree} from "./expandTypeDepFree.js";
import {simplifyType} from "./simplifyType.js";
/**
 * Parses JSDoc comments to extract parameter type information.
 *
 * @param {string} src - The JSDoc comment string to parse.
 * @param {Function} [expandType] - An optional function to process the types found in the JSDoc.
 * @returns {Record<string, any> | undefined} An object mapping parameter names to their parsed types, or undefined if no parameters are found.
 */
function parseJSDoc(src, expandType = expandTypeDepFree) {
  // Parse something like: @param {Object} [kwargs={}] Optional arguments.
  const regex = /@param \{(.*?)\} ([\[\]a-zA-Z0-9_$=\{\}\.'" ]+)/g;
  const matches = [...src.matchAll(regex)];
  /** @type {Record<string, any>} */
  const params = Object.create(null);
  matches.forEach(_ => {
    const type = expandType(_[1].trim());
    let name = _[2].trim();
    let optional = false;
    // Examples:
    //   name: [kwargs={}] The configuration parameters.
    //   name: [d = 1.0] Sample spacing
    if (name[0] === '[') {
      // Possible improvement: counting opening/closing brackets for perfect match
      const closer = name.lastIndexOf(']');
      // Afterwards name will be: d = 1.0
      name = name.substring(1, closer);
      // mark it for the type:
      optional = true;
    }
    // Strip the rest (either leftover of optional value or description)
    name = name.split(' ')[0].split('=')[0].trim();
    const simplifiedType = simplifyType(type, optional);
    const parts = name.split(".");
    if (parts.length === 3) {
      // Something like: @param {number[]} settings.render.skyboxRotation - Rotation of skybox.
      const parts0 = parts[0]; // settings
      const parts1 = parts[1]; // render
      const parts2 = parts[2]; // skyboxRotation
      const toptype = params[parts0];
      toptype.properties[parts1].properties = toptype.properties[parts1].properties || {};
      toptype.properties[parts1].properties[parts2] = simplifiedType;
    } else if (parts.length === 2) {
      // Something like: @param {number} description[].components
      let   parts0 = parts[0]; // description[]
      const parts1 = parts[1]; // components
      if (parts0.endsWith('[]')) {
        parts0 = parts0.slice(0, -2); // description[] -> description
      }
      const toptype = params[parts0];
      if (toptype?.type === "union") {
        const typeObject = toptype.members.find(_ => _?.type === 'object');
        typeObject.properties[parts1] = simplifiedType;
        //typeObject.properties = simplifiedType; // todo add test case
      } else if (toptype?.type === "array") {
        toptype.elementType.properties[parts1] = simplifiedType;
      } else if (toptype?.type === "object") {
        toptype.properties = toptype.properties || {};
        toptype.properties[parts1] = simplifiedType;
      } else {
        console.warn("parseJSDoc> skipping @param, unseen syntax detected, please check if your JSDoc is valid or open an issue about this", {
          src, toptype, parts0, parts1, simplifiedType
        });
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
export {parseJSDoc};
