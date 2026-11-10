import {expandTypeDepFree} from "../expandTypeDepFree.js";
import {parseBareTemplate} from "./parseBareTemplate.js";
/** @import {ExpandType, ExpandTypeReturnType} from './parseJSDoc.js' */

// A bracket default expands under its name.
function testBracketDefaultExpands() {
  /** @type {Record<string, ExpandTypeReturnType>} */
  const templates = Object.create(null);
  parseBareTemplate(templates, '[K=string]', expandTypeDepFree);
  return templates.K === 'string';
}

// A bare name stands in as any, but never overwrites a bound name.
function testBareNameStandsIn() {
  /** @type {Record<string, ExpandTypeReturnType>} */
  const templates = Object.create(null);
  parseBareTemplate(templates, 'K', expandTypeDepFree);
  parseBareTemplate(templates, 'K', expandTypeDepFree);
  return templates.K === 'any';
}

export const tests = [
  testBracketDefaultExpands,
  testBareNameStandsIn,
];
