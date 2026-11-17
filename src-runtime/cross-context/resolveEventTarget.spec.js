import {resolveEventTarget} from './resolveEventTarget.js';
function testPrefersSource() {
  // Iframe and window traffic answer through the event source.
  const source = {
    name: 'source',
  };
  const out = resolveEventTarget({
    source,
    srcElement: {
      name: 'fallback',
    },
  });
  return out === source;
}
function testFallsBackToSrcElement() {
  // Worker on message events carry no source: srcElement is the worker.
  const worker = {
    name: 'worker',
  };
  const out = resolveEventTarget({
    source: null,
    srcElement: worker,
  });
  return out === worker;
}
function testMissingEventIsNull() {
  // Restored rows have no event yet: null instead of a throw.
  return (
    resolveEventTarget(null) === null &&
    resolveEventTarget(undefined) === null &&
    resolveEventTarget({}) === null
  );
}
export const tests = [
  testPrefersSource,
  testFallsBackToSrcElement,
  testMissingEventIsNull,
];
