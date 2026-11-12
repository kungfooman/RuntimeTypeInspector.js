import {makeParamTag} from './makeParamTag.js';
// The head keeps only its first token: defaults and prose fall away.
function testHeadKeepsFirstToken() {
  const tag = makeParamTag('number[]', '[values] trailing words here');
  return tag.name === 'values' && tag.optional === true && tag.invalidRest === false;
}
// A leading `...` flags the misplaced-rest spelling for callers to drop.
function testLeadingDotsFlagInvalid() {
  const tag = makeParamTag('number[]', '...values');
  return tag.invalidRest === true && tag.name === '...values';
}
// A stray-furniture head (`*value`) validates to empty: the tag binds to
// nothing, matching tsc which reads it as an empty name.
function testStrayStarValidatesEmpty() {
  const tag = makeParamTag('number', '*value');
  return tag.name === '' && tag.nameRaw === '*value';
}
// Array groups survive the tag: `stats[]` scans as a path and folds on
// the bare segment names downstream.
function testPathAllowsArrayGroups() {
  const tag = makeParamTag('number', 'options.stats[].unitsName rest');
  return (
    tag.name === 'options.stats[].unitsName' &&
    tag.segments !== undefined &&
    tag.segments[1].array === true
  );
}
// The tag carries the path segments the fold consumes: gate and fold
// share one read, so they can never disagree about the name.
function testTagCarriesSegments() {
  const tag = makeParamTag('Object', '[kwargs={}] rest');
  return (
    tag.optional === true &&
    tag.segments !== undefined &&
    tag.segments.length === 1 &&
    tag.segments[0].name === 'kwargs'
  );
}
export const tests = [
  testHeadKeepsFirstToken,
  testLeadingDotsFlagInvalid,
  testStrayStarValidatesEmpty,
  testPathAllowsArrayGroups,
  testTagCarriesSegments,
];
