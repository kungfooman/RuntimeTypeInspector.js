import {makeParamTag} from './makeParamTag.js';
/** @import {ExpandedType} from './expandedType.js' */
import {foldParam} from './foldParam.js';
// Dotted names fold into nested objects while the tag stays flat.
function testDottedNameFolds() {
  /** @type {Record<string, ExpandedType | undefined>} */
  const params = Object.create(null);
  foldParam(params, 'src', makeParamTag('string', 'outputs.logits The logits'), 'string');
  return params.outputs !== undefined;
}
// Bracket names mark optionality without losing the head word.
function testBracketMarksOptional() {
  /** @type {Record<string, ExpandedType | undefined>} */
  const params = Object.create(null);
  foldParam(params, 'src', makeParamTag('Object', '[kwargs={}] rest'), 'object');
  return params.kwargs !== undefined;
}
// An array-grouped path (`options.stats[]`) still folds on the bare
// segment names: the scanner no longer binds the mangled prefix as a
// key the way the old split did (`stats[`).
function testArrayPathFoldsOnBareNames() {
  /** @type {Record<string, ExpandedType | undefined>} */
  const params = Object.create(null);
  foldParam(params, 'src', makeParamTag('string', 'options.stats[].unitsName rest'), 'string');
  return params.options !== undefined && params['stats['] === undefined;
}
// An unscannable path binds nothing instead of a mangled prefix.
function testBadPathBindsNothing() {
  /** @type {Record<string, ExpandedType | undefined>} */
  const params = Object.create(null);
  foldParam(params, 'src', makeParamTag('string', 'stats[0 rest'), 'string');
  return Object.keys(params).length === 0;
}
export const tests = [
  testDottedNameFolds,
  testBracketMarksOptional,
  testArrayPathFoldsOnBareNames,
  testBadPathBindsNothing,
];
