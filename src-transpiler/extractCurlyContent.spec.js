import {extractCurlyContent} from './extractCurlyContent.js';
function testSimplePair() {
  // Content plus the index right past the closer.
  const {content, nextIndex} = extractCurlyContent('{number} rest');
  return content === 'number' && nextIndex === '{number}'.length;
}
function testNestedPair() {
  // Inner braces pair up instead of ending the match early.
  const {content, nextIndex} = extractCurlyContent('{ {inner} } tail');
  return content === ' {inner} ' && nextIndex === '{ {inner} }'.length;
}
function testUnterminatedRunsToEnd() {
  // No closer means everything from the opener is content (callers decide).
  const {content, nextIndex} = extractCurlyContent('{abc');
  return content === 'abc' && nextIndex === '{abc'.length + 1;
}
export const tests = [
  testSimplePair,
  testNestedPair,
  testUnterminatedRunsToEnd,
];
