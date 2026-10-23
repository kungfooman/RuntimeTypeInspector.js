import {quoteName} from './quoteName.js';
function testPlainPassesThrough() {
  // Plain names escape unchanged inside their quotes.
  return quoteName`if ('${['BitPacking.set']}') {}` === "if ('BitPacking.set') {}";
}
function testDoubleQuotesTravelRaw() {
  // Bracket quoting from keyPart uses double quotes, which are safe raw.
  return quoteName`if ('${['o["a-b"]']}') {}` === `if ('o["a-b"]') {}`;
}
function testSingleQuoteEscapes() {
  // A raw single quote would end the literal early, so it escapes.
  return quoteName`if ('${['o["ap\'s"]']}') {}` === `if ('o["ap\\'s"]') {}`;
}
function testBackslashDoubles() {
  // Backslashes double first, so escaping never corrupts the name.
  return quoteName`if ('${['a\\b']}') {}` === `if ('a\\\\b') {}`;
}
function testNewlineEscapes() {
  // Raw newlines would split the emitted literal, so they escape.
  return quoteName`if ('${['o[`a\nb`]']}') {}` === "if ('o[`a\\nb`]') {}";
}
function testCarriageReturnEscapes() {
  // Carriage returns split literals the same way newlines do.
  return quoteName`if ('${['o["a\rb"]']}') {}` === `if ('o["a\\rb"]') {}`;
}
function testLineSeparatorsEscape() {
  // U+2028 and U+2029 are valid line terminators in JS source.
  return quoteName`if ('${['o["a\u2028b"]']}') {}` === `if ('o["a\\u2028b"]') {}` &&
    quoteName`if ('${['o["a\u2029b"]']}') {}` === `if ('o["a\\u2029b"]') {}`;
}
function testRawSlotsPassThrough() {
  // Code slots travel raw: only array-marked values escape.
  return quoteName`if (${'a\nb'}) {}` === "if (a\nb) {}" &&
    quoteName`${'x'}X${["o'b"]}Y` === "xXo\\'bY";
}
function testBackslashNewlineStaysTwoChars() {
  // A literal backslash-n stays two characters: no newline is born.
  return quoteName`X${['a\\nb']}Y` === "Xa\\\\nbY";
}
export const tests = [
  testPlainPassesThrough,
  testDoubleQuotesTravelRaw,
  testSingleQuoteEscapes,
  testBackslashDoubles,
  testNewlineEscapes,
  testCarriageReturnEscapes,
  testLineSeparatorsEscape,
  testRawSlotsPassThrough,
  testBackslashNewlineStaysTwoChars,
];
