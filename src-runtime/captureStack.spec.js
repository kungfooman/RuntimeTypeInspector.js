import {captureStackLines} from './captureStack.js';
function testShortStackUncut() {
  // Shallow stacks pass through whole: no cap marker appended.
  const lines = captureStackLines();
  return Array.isArray(lines) && lines.length >= 1 && lines.every((_) => typeof _ === 'string') &&
    !lines.some((_) => _.startsWith('... (+'));
}
function failDeep(depth, cap) {
  if (depth <= 0) {
    return cap === undefined ? captureStackLines() : captureStackLines(cap);
  }
  return failDeep(depth - 1, cap);
}
function testDeepStackCapped() {
  // Deep stacks keep header plus cap frames, then a count marker instead of
  // the dropped tail: bounded log rows no matter the depth.
  const lines = failDeep(30, 5);
  return lines.length === 7 && lines[6].startsWith('... (+') && lines[6].includes('more frames)');
}
function testCapCountsDropped() {
  // The marker counts exactly the dropped frames, so nothing is silently lost.
  const full = failDeep(10);
  const capped = failDeep(10, 5);
  const dropped = full.length - 6;
  return capped.length === 7 && capped[6].includes(`${dropped}`);
}
const tests = [
  testShortStackUncut,
  testDeepStackCapped,
  testCapCountsDropped,
];
export {tests};
