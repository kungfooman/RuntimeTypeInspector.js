import {logFilename} from './logFilename.js';
function testExampleName() {
  // The last path segment (the example) discriminates saved logs.
  return logFilename('http://localhost:8080/iframe/animation_blend-trees-1d.html') === 'rti-errors-animation_blend-trees-1d.json';
}
function testStripsQueryAndHash() {
  // Query/hash never leak into the filename.
  return logFilename('https://playcanvas.com/examples/animation/?x=1#y') === 'rti-errors-animation.json';
}
function testSanitizes() {
  // Unsafe filename characters collapse to single dashes, uncapped ends trimmed.
  return logFilename('http://x/a b@c!.html') === 'rti-errors-a-b-c.json';
}
function testMissingFallsBack() {
  // No URL (or garbage) keeps the plain old name instead of throwing.
  return logFilename(undefined) === 'rti-errors-log.json' && logFilename('::::') === 'rti-errors-log.json';
}
export const tests = [
  testExampleName,
  testStripsQueryAndHash,
  testSanitizes,
  testMissingFallsBack,
];
