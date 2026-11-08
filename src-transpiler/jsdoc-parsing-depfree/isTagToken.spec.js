import {isTagToken} from './isTagToken.js';
import {makeJSDocCursor} from './makeJSDocCursor.js';

// Cursor on a non-tag token (here `eof`, the only token) never opens.
function testCursorOffTagDeclines() {
  return isTagToken(makeJSDocCursor('just prose')) === false;
}

// Comment furniture before the match opens a tag.
function testFurnitureOpens() {
  const cursor = makeJSDocCursor('* @param {number} x');
  cursor.index = cursor.tokens.findIndex((token) => token.kind === 'tag');
  return isTagToken(cursor) === true;
}

// Prose before the match blocks: the lexer marks no open, so mid-line
// mentions stay out.
function testProseBlocks() {
  const cursor = makeJSDocCursor('* call foo(@param bar)');
  cursor.index = cursor.tokens.findIndex((token) => token.kind === 'tag');
  return isTagToken(cursor) === false;
}

// A section marker before the match opens: `@overload @param` rows scan.
function testOverloadMarkerOpens() {
  const cursor = makeJSDocCursor('@overload @param {number} v');
  const tags = cursor.tokens.filter((token) => token.kind === 'tag');
  cursor.index = cursor.tokens.indexOf(tags[1]);
  return isTagToken(cursor) === true;
}

// A consumed head before the match opens: same-line followers scan.
function testConsumedHeadOpens() {
  const cursor = makeJSDocCursor('@param {number} a @param {string} b');
  const tags = cursor.tokens.filter((token) => token.kind === 'tag');
  cursor.index = cursor.tokens.indexOf(tags[1]);
  cursor.consumedUpTo = 18;
  return isTagToken(cursor) === true;
}

export const tests = [
  testCursorOffTagDeclines,
  testFurnitureOpens,
  testProseBlocks,
  testOverloadMarkerOpens,
  testConsumedHeadOpens,
];
