import {tsParamTag} from './tsParamTag.js';

// A plain row reads name, brackets, and brace text through.
function testPlainRowReadsThrough() {
  const tag = {name: {getText: () => 'x'}, isBracketed: false, typeExpression: {getText: () => '{number}'}};
  const actual = tsParamTag(tag);
  return actual.name === 'x' && actual.bracketed === false && actual.type === 'number' && actual.dropped === false;
}

// A leading `...` name is the TS1003/TS8032 rejection: same verdict as
// the depfree invalidRest decline, carried as the `dropped` flag.
function testMisplacedRestDrops() {
  const tag = {name: {getText: () => '...values'}, isBracketed: false, typeExpression: {getText: () => '{number[]}'}};
  const actual = tsParamTag(tag);
  return actual.name === '...values' && actual.dropped === true;
}

// Stray furniture reads as an empty name that binds nothing, matching
// the depfree `*value` decline.
function testEmptyNameDrops() {
  const tag = {name: {getText: () => ''}, isBracketed: false, typeExpression: {getText: () => '{number}'}};
  return tsParamTag(tag).dropped === true;
}

export const tests = [testPlainRowReadsThrough, testMisplacedRestDrops, testEmptyNameDrops];
