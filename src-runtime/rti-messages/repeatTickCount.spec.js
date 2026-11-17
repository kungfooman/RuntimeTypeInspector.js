import {repeatTickCount} from './repeatTickCount.js';
function testReadsTicks() {
  // A coalesced flush carries the tick count: the panel bumps by delta.
  const data = {
    ticks: 41,
  };
  const out = repeatTickCount(data);
  const expected = 41;
  return out === expected;
}
function testLegacyDefaultsToOne() {
  // Legacy senders post one message per tick: each bumps by one. Garbage
  // counts (missing, fractional, negative) degrade to one, never to zero
  // or a throw that would take down the dispatch.
  const missing = repeatTickCount({});
  const fractionalData = {
    ticks: 1.9,
  };
  const fractional = repeatTickCount(fractionalData);
  const zeroData = {
    ticks: 0,
  };
  const zero = repeatTickCount(zeroData);
  const negativeData = {
    ticks: -3,
  };
  const negative = repeatTickCount(negativeData);
  const textData = {
    ticks: 'many',
  };
  const text = repeatTickCount(textData);
  const absent = repeatTickCount(null);
  const expected = 1;
  return (
    missing === expected &&
    fractional === expected &&
    zero === expected &&
    negative === expected &&
    text === expected &&
    absent === expected
  );
}
export const tests = [
  testReadsTicks,
  testLegacyDefaultsToOne,
];
