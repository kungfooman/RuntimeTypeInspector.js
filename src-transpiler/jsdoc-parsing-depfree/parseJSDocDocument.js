import {parseJSDocNodes} from "./parseJSDocNodes.js";
import {parseParamHead} from "./parseParamHead.js";
import {expandTypeDepFree} from "../expandTypeDepFree.js";
import {extractNameAndOptionality} from "./extractNameAndOptionality.js";
import {annotateOptional} from "../annotateOptional.js";
import {makeParamTag} from "./makeParamTag.js";
import {parseBareTemplate} from "./parseBareTemplate.js";
import {foldParam} from "./foldParam.js";
/** @import {ExpandedType} from './expandedType.js' */
/** @import {ExpandType, ExpandTypeReturnType, ParamTag} from './parseJSDoc.js' */
/**
 * Lowers one JSDoc comment from parsed tag nodes into every node at once:
 * parameter types with the raw tags behind them (rest markers survive the
 * expansion that erases them), template bindings, and the setter type. The
 * parser feeds every view from the same token stream, so `@overload`
 * sections never see params and templates disagree.
 * @example
 * parseJSDocDocument('@template T @param {T} first');
 * // {params: {first: 'T'}, templates: {T: 'any'}, setter: undefined, tags: [...]}
 * @param {string} src - The JSDoc comment string to parse.
 * @param {ExpandType} [expandType] - An optional function to process the types found in the JSDoc.
 * @returns {{params: Record<string, ExpandTypeReturnType> | undefined, templates: Record<string, ExpandTypeReturnType> | undefined, setter: ExpandedType | undefined, tags: ParamTag[]}} Every view over the one scan.
 */
function parseJSDocDocument(src, expandType = expandTypeDepFree) {
  /** @type {Record<string, ExpandTypeReturnType>} */
  const params = Object.create(null);
  /** @type {ParamTag[]} */
  const tags = [];
  /** @type {Record<string, ExpandTypeReturnType>} */
  const templates = Object.create(null);
  /** @type {{tag: string, typeRaw: string, headRaw: string}[]} */
  const foundSetter = [];
  for (const scanned of parseJSDocNodes(src)) {
    if (scanned.tag === '@param') {
      // The head may carry the type itself (matter-js swaps the order:
      // `@param label {string}`): tsc binds the head's first word as the
      // name and the first `{...}` group past it as the type, so the
      // fold splits the same way instead of binding nothing. The probe
      // readers apply the identical split; the grammar owns the name
      // boundary on every side, so rows and runtime types agree.
      const headName = parseParamHead(scanned.headRaw).name;
      const group = scanned.typeRaw === '' && headName !== '' ? scanned.headRaw.slice(scanned.headRaw.indexOf(headName) + headName.length).match(/\{([^{}]*)\}/) : null;
      const brace = group !== null && group[1].trim() !== '' ? group[1] : scanned.typeRaw;
      const head = group !== null && group[1].trim() !== '' ? headName : scanned.headRaw;
      const rawType = expandType(brace.trim());
      if (rawType === undefined) {
        tags.push(makeParamTag(brace, head));
        console.warn(
          'parseJSDoc> Skipping @param, type is unrepresentable. ' +
            'Please check if your JSDoc is valid or open an issue about this!',
          {src, match: brace},
        );
        continue;
      }
      const tag = makeParamTag(brace, head);
      tags.push(tag);
      if (tag.invalidRest === true || tag.name === '') {
        continue;
      }
      foldParam(params, src, tag, rawType);
    } else if (scanned.tag === '@template') {
      if (scanned.typeRaw !== '') {
        const [headName] = extractNameAndOptionality(scanned.headRaw);
        const type = expandType(scanned.typeRaw.trim());
        templates[headName] = type;
        continue;
      }
      parseBareTemplate(templates, scanned.headRaw, expandType);
    } else if (scanned.tag === '@type') {
      foundSetter.push(scanned);
    }
  }
  let setter;
  if (foundSetter.length === 1) {
    const type = expandType(foundSetter[0].typeRaw);
    setter = annotateOptional(type, /* optional */ false);
  }
  return {
    params: Object.keys(params).length === 0 ? undefined : params,
    templates: Object.keys(templates).length === 0 ? undefined : templates,
    setter,
    tags,
  };
}
export {parseJSDocDocument};
