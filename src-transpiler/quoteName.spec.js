import {quoteName} from './quoteName.js';
function testPlainPassesThrough() {
  // Plain names gain only the surrounding quotes.
  return quoteName('BitPacking.set') === "'BitPacking.set'";
}
function testDoubleQuotesTravelRaw() {
  // Bracket quoting from keyPart uses double quotes, which are safe raw.
  return quoteName('o["a-b"]') === '\'o["a-b"]\'';
}
function testSingleQuoteEscapes() {
  // A raw single quote would end the literal early, so it escapes.
  return quoteName("o[\"ap's\"]") === '\'o["ap\\\'s"]\'';
}
function testBackslashDoubles() {
  // Backslashes double first, so escaping never corrupts the name.
  return quoteName('a\\b') === '\'a\\\\b\'';
}
export const tests = [
  testPlainPassesThrough,
  testDoubleQuotesTravelRaw,
  testSingleQuoteEscapes,
  testBackslashDoubles,
];
