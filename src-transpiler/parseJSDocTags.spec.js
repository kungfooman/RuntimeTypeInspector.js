import {parseJSDocTags} from './parseJSDocTags.js';

// Tags on one line scan independently: the head token keeps the name.
function testSameLineTags() {
  const actual = parseJSDocTags('* @param {string} text @param {number} n');
  const tag = actual[0];
  return (
    actual.length === 1 &&
    tag.typeRaw === 'string' &&
    tag.name === 'text'
  );
}

// A mid-line `@param` inside prose is not a tag.
function testInlineMentionSkips() {
  const actual = parseJSDocTags('* call foo(@param bar) here');
  return actual.length === 0;
}

// A rest marker before the name flags the invalid spelling, not a rest tag.
function testMisplacedRestFlagsInvalid() {
  const actual = parseJSDocTags('* @param {number[]} ...values');
  const tag = actual[0];
  return (
    actual.length === 1 &&
    tag.invalidRest === true &&
    tag.name === '...values'
  );
}

// Trailing prose stays out of the name: only the head token is kept.
function testTrailingProseKeepsHead() {
  const actual = parseJSDocTags('* @param {...number[]} values trailing words here');
  const tag = actual[0];
  return actual.length === 1 && tag.name === 'values' && tag.invalidRest === false;
}

export const tests = [testSameLineTags, testInlineMentionSkips, testMisplacedRestFlagsInvalid, testTrailingProseKeepsHead];
