import {tsDottedChildren} from './tsDottedChildren.js';

// Dotted rows after a merged container recover their own heads and
// brace text: TS absorbs them, so this re-slice is the only source.
function testDottedRowsRecoverHeads() {
  const src = '@param {object} options Opts.\n@param {number} [options.maxRetries] Max.\n@param {boolean} [options.json] Flag.';
  const actual = tsDottedChildren('options', src, 1);
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
  const actual = tsDottedChildren('options', src, 1);
  return actual.length === 1 && actual[0].name === 'options.maxRetries';
}

export const tests = [testDottedRowsRecoverHeads, testNonDottedRowStopsSlice];
