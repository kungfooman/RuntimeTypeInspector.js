import {recoverTildeTag} from './recoverTildeTag.js';
// A tilde-truncated type recovers the raw brace and the head after it.
function testTildeTruncationRecoversRaw() {
  const actual = recoverTildeTag('@param {Array<X~Y>} x', 'Array<X');
  return (
    actual !== null &&
    actual.typeRaw === 'Array<X~Y>' &&
    actual.headRaw === 'x'
  );
}
// A bracketed head with prose survives whole: the depfree builders parse
// the same head text the depfree reader saw.
function testBracketedHeadSurvivesWhole() {
  const actual = recoverTildeTag('@param {Array<X~Y>} [hits=[]] - T.', 'Array<X');
  return (
    actual !== null &&
    actual.typeRaw === 'Array<X~Y>' &&
    actual.headRaw === '[hits=[]] - T.'
  );
}
// Agreement needs no recovery: identical text returns null.
function testAgreementReturnsNull() {
  return recoverTildeTag('@param {number} x', 'number') === null;
}
// A missing source (spec fakes without tag getText) returns null: callers
// keep TS-parsed values instead of crashing.
function testMissingSourceReturnsNull() {
  return recoverTildeTag(undefined, 'Array<X') === null;
}
// An unclosed brace never resolves: callers keep TS-parsed text.
function testUnclosedBraceReturnsNull() {
  return recoverTildeTag('@param {number', 'number') === null;
}
// A tilde-free divergence is not a tilde: only `~` continuation recovers.
function testNonTildeDivergenceReturnsNull() {
  return recoverTildeTag('@param {Object<string, number>} x', 'Object<string') === null;
}
export const tests = [
  testTildeTruncationRecoversRaw,
  testBracketedHeadSurvivesWhole,
  testAgreementReturnsNull,
  testMissingSourceReturnsNull,
  testUnclosedBraceReturnsNull,
  testNonTildeDivergenceReturnsNull,
];
