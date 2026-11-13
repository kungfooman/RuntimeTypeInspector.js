import {parseNamePath, parseBracketName} from './parseNamePath.js';
import {makeJSDocCursor} from './makeJSDocCursor.js';
// A plain dotted path splits into bare segments.
function testPathSplitsDots() {
  const {segments, valid} = parseNamePath('options.stats.unitsName');
  return (
    valid === true &&
    segments.length === 3 &&
    segments[0].name === 'options' &&
    segments[2].name === 'unitsName' &&
    segments.every((segment) => segment.array === false)
  );
}
// `[]` and `[digits]` mark the segment as an array access instead of
// truncating the name the way the old `split(/[\[\]]*\./)` did
// (`stats[0` bound as a key).
function testPathMarksArray() {
  const plain = parseNamePath('options.stats[].unitsName');
  const indexed = parseNamePath('options[0].unitsName');
  return (
    plain.valid === true &&
    plain.segments[1].array === true &&
    plain.segments[1].name === 'stats' &&
    indexed.valid === true &&
    indexed.segments[0].array === true &&
    indexed.segments[0].name === 'options'
  );
}
// Anything the scanner cannot place fails the whole path: the caller
// drops the tag instead of binding a mangled prefix as a real key.
function testPathFailsClosed() {
  const cases = ['stats[0', 'a-b', '', 'a..b', 'a.', 'a[foo]'];
  return cases.every((path) => parseNamePath(path).valid === false);
}
// A bracketed name reads as tokens: the name is the run inside, the
// default is consumed and discarded, the closer advances the cursor.
function testBracketNameReadsTokens() {
  const cursor = makeJSDocCursor('[kwargs={}] rest');
  const {name, optional, next} = parseBracketName(cursor);
  return (
    name === 'kwargs' &&
    optional === true &&
    next === 6
  );
}
// Dotted bracket names keep their path and default: `[options.level=3]`
// binds `options.level` as optional.
function testBracketNameKeepsPath() {
  const cursor = makeJSDocCursor('[options.level=3] rest');
  const {name, optional} = parseBracketName(cursor);
  return name === 'options.level' && optional === true;
}
// Stray punctuation never glues: `[a-b]` surfaces `a-b` for validation
// to reject, instead of the silent `ab` a text join would bind.
function testBracketNameKeepsStray() {
  const cursor = makeJSDocCursor('[a-b] x');
  const {name, optional, next} = parseBracketName(cursor);
  return (
    optional === true &&
    next === 5 &&
    parseNamePath(name).valid === false
  );
}
// An unclosed bracket consumes nothing: the caller sees the opener and
// falls back to the bare-head path.
function testBracketNameFailsOpen() {
  const cursor = makeJSDocCursor('[unclosed rest');
  const {name, optional, next} = parseBracketName(cursor);
  return (
    name === '' &&
    optional === false &&
    next === 0
  );
}
export const tests = [
  testPathSplitsDots,
  testPathMarksArray,
  testPathFailsClosed,
  testBracketNameReadsTokens,
  testBracketNameKeepsPath,
  testBracketNameKeepsStray,
  testBracketNameFailsOpen,
];
