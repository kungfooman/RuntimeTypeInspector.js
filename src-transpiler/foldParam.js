import {annotateOptional} from "./annotateOptional.js";
import {isUnionNode} from "./isUnionNode.js";
import {isArrayNode} from "./isArrayNode.js";
import {isObjectNode} from "./isObjectNode.js";
/** @import {ExpandedType} from './expandedType.js' */
/** @import {ParamTag} from './parseJSDoc.js' */

/**
 * Folds one expanded param into the record: bracket names mark optionality
 * and dotted names nest into object properties (`options.stats`). Consumes
 * the already-read tag, not the raw head: stripping and validation happen
 * once in `parseParamHead`, so the gate and the fold can never disagree.
 * A tag without segments binds nothing.
 * @example
 * const params = {};
 * const tag = makeParamTag('string', 'outputs.logits hi');
 * foldParam(params, 'src', tag, 'string');
 * // params.outputs !== undefined
 * @param {Record<string, ExpandedType | undefined>} params - The record to fold into.
 * @param {string} src - The JSDoc comment string, for warnings.
 * @param {ParamTag} tag - The read param tag with its path segments.
 * @param {ExpandedType} rawType - The expanded type.
 * @returns {void}
 */
function foldParam(params, src, tag, rawType) {
  const annotatedType = annotateOptional(rawType, tag.optional);
  // "options.stats[].unitsName" folds on the bare segment names. A tag
  // without segments binds nothing: binding a mangled prefix as a real
  // key would invent a parameter the JSDoc never named.
  const segments = tag.segments ?? [];
  if (tag.name === '' || segments.length === 0) {
    return;
  }
  const parts = segments.map((segment) => segment.name);
  /** @type {Record<string, ExpandedType | undefined>} */
  let properties = params;
  for (const part of parts) {
    const toptype = properties[part];
    if (toptype === undefined) {
      // No toptype means we resolved as far as possible, now we can add `annotatedType`.
      console.assert(part === parts.at(-1), 'Current part and last part should be the same.');
      properties[part] = annotatedType;
    } else if (isUnionNode(toptype)) {
      const typeObject = toptype.members.find(isObjectNode);
      if (typeObject === undefined || typeObject.properties === undefined) {
        console.warn(
          "parseJSDoc> Skipping @param, union has no object member to navigate into. Please check if your JSDoc is valid or open an issue about this!",
          {src, toptype, parts, annotatedType}
        );
      } else {
        properties = typeObject.properties;
      }
    } else if (isArrayNode(toptype)) {
      const elementType = toptype.elementType;
      if (!isObjectNode(elementType) || elementType.properties === undefined) {
        console.warn(
          "parseJSDoc> Skipping @param, array element has no properties to navigate into. Please check if your JSDoc is valid or open an issue about this!",
          {src, toptype, parts, annotatedType}
        );
      } else {
        properties = elementType.properties;
      }
    } else if (isObjectNode(toptype)) {
      toptype.properties = toptype.properties || Object.create(null);
      const props = toptype.properties;
      if (props !== undefined) {
        properties = props;
      }
    } else {
      console.warn(
        "parseJSDoc> Skipping @param, unseen syntax detected. Please check if your JSDoc is valid or open an issue about this!",
        {src, toptype, parts, annotatedType}
      );
    }
  }
}
export {foldParam};
