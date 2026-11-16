import {noteKey} from './noteKey.js';
function testCountsPerKey() {
  // Ticks accumulate per key: the flush later posts one delta per key.
  const store = new Map();
  const first = noteKey(store, 'frame');
  const second = noteKey(store, 'frame');
  const other = noteKey(store, 'tick');
  return (
    first === 1 &&
    second === 2 &&
    other === 1 &&
    store.get('frame') === 2
  );
}
function testHostileKeyStaysSilent() {
  // A hostile key (frozen store, throwing map) degrades to zero ticks,
  // never into a broken sender.
  const out = noteKey(null, 'frame');
  const expected = 0;
  return out === expected;
}
export const tests = [
  testCountsPerKey,
  testHostileKeyStaysSilent,
];
