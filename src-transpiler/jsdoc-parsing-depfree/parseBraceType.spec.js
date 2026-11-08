import {makeJSDocCursor} from './makeJSDocCursor.js';
import {parseBraceType} from './parseBraceType.js';

// A balanced type returns its inner text and the head offset after it.
function testBalancedTypeReads() {
  const cursor = makeJSDocCursor('{number} x');
  const {typeRaw, balanced, headStart} = parseBraceType(cursor);
  return typeRaw === 'number' && balanced === true && cursor.src.slice(headStart).trim() === 'x';
}

// The cursor advances past the closer; trivia between the closer and the
// head is the head reader's to skip, not the brace reader's.
function testBalancedAdvancesCursor() {
  const cursor = makeJSDocCursor('{number} x');
  parseBraceType(cursor);
  return cursor.tokens[cursor.index].kind === 'space';
}

// Nested braces balance by depth: the first balancing closer wins, so
// `{a{b}c}` reads whole and the head keeps nothing structural.
function testNestedBracesBalance() {
  const cursor = makeJSDocCursor('{a{b}c} x');
  const {typeRaw, balanced} = parseBraceType(cursor);
  return typeRaw === 'a{b}c' && balanced === true;
}

// An unclosed brace without a recoverable head runs to the comment end
// and reports unbalanced.
function testUnbalancedRunsToEnd() {
  const cursor = makeJSDocCursor('{number ');
  const {typeRaw, balanced} = parseBraceType(cursor);
  return typeRaw === 'number ' && balanced === false;
}

// An unclosed brace recovers like tsc: the type is the first word, the
// head the name after it, instead of failing the whole tag.
function testUnbalancedRecoversHead() {
  const cursor = makeJSDocCursor('{number a');
  const {typeRaw, balanced, headStart} = parseBraceType(cursor);
  return typeRaw === 'number' && balanced === false && cursor.src.slice(headStart).trim() === 'a';
}

export const tests = [
  testBalancedTypeReads,
  testBalancedAdvancesCursor,
  testNestedBracesBalance,
  testUnbalancedRunsToEnd,
  testUnbalancedRecoversHead,
];
