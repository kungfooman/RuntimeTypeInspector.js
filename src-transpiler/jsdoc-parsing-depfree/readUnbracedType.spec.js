import {readUnbracedType} from './readUnbracedType.js';

// The class word alone reads alone, like tsc's unbraced type tag.
function testWordAloneReads() {
  return readUnbracedType('Expression ') === 'Expression';
}

// A `&` chain reads through words: tsc binds the whole intersection.
function testIntersectionChainReads() {
  return readUnbracedType('Foo & Bar ') === 'Foo & Bar';
}

// The first non-type token starts the comment: tsc splits trailing
// prose off the clause.
function testTrailingProseSplits() {
  return readUnbracedType('Foo & Bar some prose here ') === 'Foo & Bar';
}

// A balanced object tail reads whole: tsc reparses the class word with
// the clause into one intersection.
function testObjectTailReadsWhole() {
  return readUnbracedType('Foo & { a: number } ') === 'Foo & { a: number }';
}

// The svelte cast tail strips its orphan `;`: the clause is closed and
// the `;` is statement text — exactly like `stripTsBraces`.
function testCastTailStripsSemicolon() {
  return readUnbracedType('HTMLElement & { object: { test: true }; } ') === 'HTMLElement & { object: { test: true } }';
}

// Trailing prose after the cast tail still strips the orphan `;`:
// tsc owns the same extent through the brace group.
function testTrailingProseKeepsObject() {
  return readUnbracedType('HTMLElement & { object: { test: true }; } trailing prose ') === 'HTMLElement & { object: { test: true } }';
}

// tsc's recovery tail on an unclosed object re-balances: the clause
// gains its ` }` exactly like `stripTsBraces` closes it.
function testRecoveryTailRebalances() {
  return readUnbracedType('HTMLElement & { object: { test: true }; ') === 'HTMLElement & { object: { test: true } }';
}

// A line break ends the clause even inside braces: tsc splits the type
// from the comment there.
function testNewlineEndsClause() {
  return readUnbracedType('Foo & { a: number }\nnext ') === 'Foo & { a: number }';
}

// A leading `-` binds nothing: tsc parses no type there.
function testLeadingDashBindsNothing() {
  return readUnbracedType('-Foo ') === '';
}

export const tests = [
  testWordAloneReads,
  testIntersectionChainReads,
  testTrailingProseSplits,
  testObjectTailReadsWhole,
  testCastTailStripsSemicolon,
  testTrailingProseKeepsObject,
  testRecoveryTailRebalances,
  testNewlineEndsClause,
  testLeadingDashBindsNothing,
];
