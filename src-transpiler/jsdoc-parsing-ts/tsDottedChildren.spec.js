import {tsDottedChildren} from './tsDottedChildren.js';
// Dotted rows after a merged container recover their own heads and
// brace text: TS absorbs them, so this re-slice is the only source.
// Segments split on `@param`: index 0 is the pre-tag head, 1 is the
// container, children start at 2.
function testDottedRowsRecoverHeads() {
  const src = '@param {object} options Opts.\n@param {number} [options.maxRetries] Max.\n@param {boolean} [options.json] Flag.';
  const actual = tsDottedChildren('options', src, 2);
  return (
    actual.length === 2 &&
    actual[0].name === 'options.maxRetries' &&
    actual[0].bracketed === true &&
    actual[0].type === 'number' &&
    actual[1].name === 'options.json'
  );
}
// A non-dotted row stops the slice: only the container's children belong.
function testNonDottedRowStopsSlice() {
  const src = '@param {object} options Opts.\n@param {number} [options.maxRetries] Max.\n@param {string} other Tail.';
  const actual = tsDottedChildren('options', src, 2);
  return actual.length === 1 && actual[0].name === 'options.maxRetries';
}
// A bracketed head with spaces inside its default (`=new Object3D()`)
// reads whole: the bracket group wins over the bare token, so the child
// survives instead of truncating at the space and breaking the slice.
function testBracketedHeadWithSpacedDefaultReadsWhole() {
  const src = '@param {Object} [parameters={}] O.\n@param {Object3D} [parameters.target=new Object3D()] T.\n@param {number} [parameters.resolutionScale=1] R.';
  const actual = tsDottedChildren('parameters', src, 2);
  return (
    actual.length === 2 &&
    actual[0].name === 'parameters.target' &&
    actual[0].type === 'Object3D' &&
    actual[1].name === 'parameters.resolutionScale'
  );
}
export const tests = [testDottedRowsRecoverHeads, testNonDottedRowStopsSlice, testBracketedHeadWithSpacedDefaultReadsWhole];
