import {escapeName} from './escapeName.js';
function testPlainPassesThrough() {
  // Plain names escape unchanged.
  return escapeName('BitPacking.set') === 'BitPacking.set';
}
function testDoubleQuotesTravelRaw() {
  // Bracket quoting from keyPart uses double quotes, which are safe raw.
  return escapeName('o["a-b"]') === 'o["a-b"]';
}
function testSingleQuoteEscapes() {
  // A raw single quote would end the literal early, so it escapes.
  return escapeName('o["ap\'s"]') === 'o["ap\\\'s"]';
}
function testBackslashDoubles() {
  // Backslashes double first, so escaping never corrupts the name.
  return escapeName('a\\b') === 'a\\\\b';
}
function testNewlineEscapes() {
  // Raw newlines would split the emitted literal, so they escape.
  return escapeName('o[`a\nb`]') === 'o[`a\\nb`]';
}
function testCarriageReturnEscapes() {
  // Carriage returns split literals the same way newlines do.
  return escapeName('o["a\rb"]') === 'o["a\\rb"]';
}
function testLineSeparatorsEscape() {
  // U+2028 and U+2029 are valid line terminators in JS source.
  return escapeName('o["a\u2028b"]') === 'o["a\\u2028b"]' &&
    escapeName('o["a\u2029b"]') === 'o["a\\u2029b"]';
}
function testBackslashNewlineStaysTwoChars() {
  // A literal backslash-n stays two characters: no newline is born.
  return escapeName('a\\nb') === 'a\\\\nb';
}
export const tests = [
  testPlainPassesThrough,
  testDoubleQuotesTravelRaw,
  testSingleQuoteEscapes,
  testBackslashDoubles,
  testNewlineEscapes,
  testCarriageReturnEscapes,
  testLineSeparatorsEscape,
  testBackslashNewlineStaysTwoChars,
];
