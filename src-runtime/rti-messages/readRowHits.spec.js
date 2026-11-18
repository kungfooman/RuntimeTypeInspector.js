import {readRowHits} from './readRowHits.js';
function testReadsHitsByKey() {
  // Each row contributes its exact firing count, including coalesced ticks.
  const warnings = {
    a: {
      hits: 42,
    },
  };
  const hits = readRowHits(warnings);
  return hits.size === 1 && hits.get('a') === 42;
}
function testSkipsJunkRows() {
  // Null rows and non-number counts never make the map: only real counts
  // decide what the refold stamps.
  const warnings = {
    a: null,
    b: {},
    c: {
      hits: 'many',
    },
  };
  const hits = readRowHits(warnings);
  return hits.size === 0;
}
function testHostileInputYieldsEmptyMap() {
  // A hostile registry reads as no counts instead of breaking the switch.
  const hits = readRowHits(null);
  return hits instanceof Map && hits.size === 0;
}
const tests = [
  testReadsHitsByKey,
  testSkipsJunkRows,
  testHostileInputYieldsEmptyMap,
];
export {tests};
