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

// A tilde-truncated type recovers the raw row through the depfree
// builders: the name binds and the type reads whole, like the depfree
// reader, instead of parroting tsc's truncation.
function testTildeTypeRecoversRawRow() {
  const tag = {
    getText: () => '@param {Array<X~Y>} intersects',
    name: {getText: () => ''},
    isBracketed: false,
    typeExpression: {getText: () => '{Array<X'},
  };
  const actual = tsParamTag(tag);
  return (
    actual.name === 'intersects' &&
    actual.bracketed === false &&
    actual.type === 'Array<X~Y>' &&
    actual.dropped === false
  );
}

// A bracketed tilde head recovers the bracket flag the parse lost.
function testTildeBracketedHeadRecoversFlag() {
  const tag = {
    getText: () => '@param {Array<X~Y>} [hits=[]]',
    name: {getText: () => ''},
    isBracketed: false,
    typeExpression: {getText: () => '{Array<X'},
  };
  const actual = tsParamTag(tag);
  return actual.name === 'hits' && actual.bracketed === true && actual.dropped === false;
}

export const tests = [testPlainRowReadsThrough, testMisplacedRestDrops, testEmptyNameDrops, testTildeTypeRecoversRawRow, testTildeBracketedHeadRecoversFlag];
