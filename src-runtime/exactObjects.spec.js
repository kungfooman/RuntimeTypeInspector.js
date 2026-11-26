import {markFresh   } from './freshObjects.js';
import {validateType} from './validateType.js';
import {expandType  } from '../src-transpiler/expandType.js';
const warn = () => undefined;
// Fresh literals with excess keys fail, stale objects pass like tsc.
function testFreshExcessFailsStalePasses() {
  const expect = expandType('{a: number}');
  const freshValue = markFresh({
    a: 1,
    extra: true,
  });
  const staleValue = {
    a: 1,
    extra: true,
  };
  const freshFails = validateType(freshValue, expect, 'loc', 'name', true, warn, 0) === false;
  return freshFails && validateType(staleValue, expect, 'loc', 'name', true, warn, 0);
}
// Stale values always pass: no flag re-enables excess failures.
function testStaleAlwaysPasses() {
  const expect = expandType('{a: number}');
  const staleValue = {
    a: 1,
    extra: true,
  };
  return validateType(staleValue, expect, 'loc', 'name', true, warn, 0);
}
// Clean literals pass at any freshness.
function testExactPassesClean() {
  const expect = expandType('{a: number}');
  const freshValue = markFresh({
    a: 1,
  });
  const staleValue = {
    a: 1,
  };
  const freshPasses = validateType(freshValue, expect, 'loc', 'name', true, warn, 0);
  return freshPasses && validateType(staleValue, expect, 'loc', 'name', true, warn, 0);
}
// Nested split: outer fresh with stale inner reads per node, like tsc.
function testNestedExcessFails() {
  const expect = expandType('{sub: {a: number}}');
  const innerFresh = markFresh({
    a: 1,
    extra: 2,
  });
  const freshOuter = markFresh({
    sub: innerFresh,
  });
  const freshFails = validateType(freshOuter, expect, 'loc', 'name', true, warn, 0) === false;
  const inner = {
    a: 1,
    extra: 2,
  };
  const staleOuter = markFresh({
    sub: inner,
  });
  const stalePasses = validateType(staleOuter, expect, 'loc', 'name', true, warn, 0);
  return freshFails && stalePasses;
}
// Excess in one member must not poison the other: a clean value still matches.
function testUnionPicksCleanMember() {
  return validateType({
    a: 1,
  }, expandType('{a: number} | {b: string}'), 'loc', 'name', true, warn, 0);
}
// The failure names the offending key, so the log points at the probe.
function testExcessMessageNamesKey() {
  const messages = [];
  const freshValue = markFresh({
    a: 1,
    bogus: 2,
  });
  const record = (...args) => messages.push(args[0]);
  validateType(freshValue, expandType('{a: number}'), 'loc', 'name', true, record, 0);
  return messages.some((entry) => typeof entry === 'string' && entry.includes('bogus'));
}
// Profiler metadata never counts as excess at any freshness.
function testProfilerHintStillIgnored() {
  const expect = expandType('{a: number}');
  const freshValue = markFresh({
    a: 1,
    profilerHint: 'x',
  });
  const staleValue = {
    a: 1,
    profilerHint: 'x',
  };
  const freshPasses = validateType(freshValue, expect, 'loc', 'name', true, warn, 0);
  return freshPasses && validateType(staleValue, expect, 'loc', 'name', true, warn, 0);
}
const tests = [
  testFreshExcessFailsStalePasses,
  testStaleAlwaysPasses,
  testExactPassesClean,
  testNestedExcessFails,
  testUnionPicksCleanMember,
  testExcessMessageNamesKey,
  testProfilerHintStillIgnored,
];
export {tests};
