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

// Braceless `@typedef`/`@type` declensions: `@typedef` without braces
// carries structure the row schema cannot hold, so only a following tag
// still scans. A braceless `@type` reads the head word as the type (like
// tsc's unbraced type tag), so its row survives.
function testParserDeclinesBareTypes() {
  const noTypedef = parseJSDocNodes('@typedef Foo @param {number} x');
  const bareType = parseJSDocNodes('@type Foo @param {number} x');
  return (
    noTypedef.length === 0 &&
    bareType.length === 2 &&
    bareType[0].typeRaw === 'Foo' &&
    bareType[1].headRaw === 'x'
  );
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

// A braceless `@param` keeps its head word (prose rides after): tsc
// binds the name and carries the rest as comment text, so the node must
// read the whole head for the shared grammar to split.
function testParserKeepsBracelessParamHead() {
  const actual = parseJSDocNodes('@param value Wrapped native hook.');
  return (
    actual.length === 1 &&
    actual[0].tag === '@param' &&
    actual[0].typeRaw === '' &&
    actual[0].headRaw === 'value Wrapped native hook.'
  );
}

// A swapped type-after-name head keeps the group for the reader split:
// tsc binds the head's first word as the name and the group as the type
// (matter-js `@param ...plugin {Function} The plugins`), so the node
// must not swallow the group as prose.
function testParserKeepsPostBraceHead() {
  const actual = parseJSDocNodes('@param ...plugin {Function} The plugin(s)');
  return (
    actual.length === 1 &&
    actual[0].tag === '@param' &&
    actual[0].typeRaw === '' &&
    actual[0].headRaw === '...plugin {Function} The plugin(s)'
  );
}

// A bare `@template O, P` keeps the whole head: the comma list binds
// two names downstream, and truncation at the comma would amputate one.
function testParserKeepsTemplateCommaHead() {
  const actual = parseJSDocNodes('@template O, P The obj and props types');
  return actual.length === 1 && actual[0].headRaw === 'O, P The obj and props types';
}

// A template head still chains into the next row: the follower tag opens.
function testParserChainsTemplateIntoFollower() {
  const actual = parseJSDocNodes('@template K email me @foo.com');
  return actual.length === 1 && actual[0].headRaw === 'K email me @foo.com';
}

// A mention between two known tags attaches on its own: tsc binds all
// three rows (the mention's head stops at the next tag), so the parser
// keeps all three too.
function testParserSpendsChainOnMention() {
  const actual = parseJSDocNodes('* @param {A} a mentions @param vaguely @param {B} c');
  return (
    actual.length === 3 &&
    actual[0].headRaw === 'a mentions' &&
    actual[1].headRaw === 'vaguely' &&
    actual[2].headRaw === 'c'
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
  testParserKeepsBracelessParamHead,
  testParserKeepsPostBraceHead,
  testParserKeepsTemplateCommaHead,
  testParserChainsTemplateIntoFollower,
  testParserSpendsChainOnMention,
];
