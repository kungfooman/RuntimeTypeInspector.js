import {takeKeys} from './takeKeys.js';
function testDrainsAndClears() {
  // Draining hands over a copy and empties the store: a second take
  // never double flushes the same ticks.
  const data = new Map([
    ['frame', 2],
    ['tick', 1],
  ]);
  const store = new Map(data);
  const out = takeKeys(store);
  return (
    out.size === 2 &&
    out.get('frame') === 2 &&
    store.size === 0
  );
}
function testHostileStoreStaysSilent() {
  // A broken store degrades into an empty flush, never into a throw.
  const out = takeKeys(null);
  return out instanceof Map && out.size === 0;
}
export const tests = [
  testDrainsAndClears,
  testHostileStoreStaysSilent,
];
