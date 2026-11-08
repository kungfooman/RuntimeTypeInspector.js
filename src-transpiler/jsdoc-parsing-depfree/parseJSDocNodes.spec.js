import {parseJSDocNodes} from './parseJSDocNodes.js';

// The parser emits one node per tag row: same-line tags stay separate.
function testParserSplitsRows() {
  const actual = parseJSDocNodes('@param {number} a @param {string} b');
  return (
    actual.length === 2 &&
    actual[0].headRaw === 'a' &&
    actual[1].headRaw === 'b'
  );
}

// Mid-line prose never opens a tag.
function testParserSkipsProse() {
  return parseJSDocNodes('* call foo(@param bar) here').length === 0;
}

// Inline synthetic sections parse: `@overload @param` rows stay visible.
function testParserKeepsOverloadRows() {
  const actual = parseJSDocNodes('@overload @param {number} value');
  return actual.length === 2 && actual[1].headRaw === 'value';
}

// Bare `@template K` chains into the following `@param`: the consumed
// head offset opens the next row.
function testParserChainsBareTemplate() {
  const actual = parseJSDocNodes('@template K @param {K} x');
  return (
    actual.length === 2 &&
    actual[0].headRaw === 'K' &&
    actual[1].typeRaw === 'K'
  );
}

// Braceless `@typedef`/`@type` decline: no brace type, no node, and the
// following `@param` still scans on its own line.
function testParserDeclinesBareTypes() {
  const noTypedef = parseJSDocNodes('@typedef Foo @param {number} x');
  const noType = parseJSDocNodes('@type Foo @param {number} x');
  return noTypedef.length === 0 && noType.length === 0;
}

// An unclosed brace recovers the head word and the following tag still
// opens its own row, matching tsc recovery.
function testParserRecoversUnbalanced() {
  const single = parseJSDocNodes('/** @param {number a */');
  const two = parseJSDocNodes('/** @param {number a @param {string} b */');
  return (
    single.length === 1 &&
    single[0].typeRaw === 'number' &&
    single[0].headRaw === 'a' &&
    two.length === 2 &&
    two[1].headRaw === 'b'
  );
}

// Mid-line `@returns {T}` after a param keeps its brace type, matching
// tsc which binds the return whatever line it sits on.
function testParserKeepsMidlineReturnType() {
  const actual = parseJSDocNodes('@param {number} a @param {number} b @returns {number[]}');
  return (
    actual.length === 3 &&
    actual[2].tag === '@returns' &&
    actual[2].typeRaw === 'number[]'
  );
}

export const tests = [
  testParserSplitsRows,
  testParserSkipsProse,
  testParserKeepsOverloadRows,
  testParserChainsBareTemplate,
  testParserDeclinesBareTypes,
  testParserRecoversUnbalanced,
  testParserKeepsMidlineReturnType,
];
