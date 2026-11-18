import {refoldLogEntries} from './refoldLogEntries.js';
function testFullKeepsEveryEntry() {
  // Switching to `full` never merges: the accumulated log downloads as is.
  const log = [{
    key: 'a',
    hits: 1,
  }, {
    key: 'a',
    hits: 2,
  }];
  const refolded = refoldLogEntries({
    log,
    mode: 'full',
    maxSize: 1000,
  });
  return (
    refolded.length === 2 &&
    refolded[0].hits === 1 &&
    refolded[1].hits === 2
  );
}
function testOneKeepsLatestEntryPerKey() {
  // The 4.2 MB case: three unfolded entries for one key collapse into the
  // latest entry, so the download carries the newest failure, not a merge.
  const log = [{
    key: 'a',
    valueToString: 'false',
    hits: 1,
    message: 'first',
  }, {
    key: 'a',
    valueToString: 'undef',
    hits: 1,
    message: 'second',
  }, {
    key: 'a',
    valueToString: 'false',
    hits: 1,
    message: 'third',
  }];
  const refolded = refoldLogEntries({
    log,
    mode: 'one',
    maxSize: 1000,
  });
  return (
    refolded.length === 1 &&
    refolded[0].key === 'a' &&
    refolded[0].valueToString === 'false' &&
    refolded[0].message === 'third' &&
    refolded[0].hits === 1
  );
}
function testOneStampsExactRowHits() {
  // The row counts every firing, including coalesced repeat ticks the log
  // never saw: the refold stamps the exact row counts onto the survivors
  // instead of summing the log's partial per-entry numbers.
  const log = [{
    key: 'a',
    valueToString: 'false',
    hits: 1,
    message: 'third',
  }];
  const hitsByKey = new Map([['a', 2638]]);
  const refolded = refoldLogEntries({
    log,
    mode: 'one',
    maxSize: 1000,
    hitsByKey,
  });
  return (
    refolded.length === 1 &&
    refolded[0].valueToString === 'false' &&
    refolded[0].hits === 2638
  );
}
function testOneFoldingIsLossy() {
  // Folding forward loses values: once `one` kept only the latest failure,
  // switching back to `values` cannot resurrect the folded-away variants.
  const log = [{
    key: 'a',
    valueToString: 'false',
    hits: 3,
    message: 'latest',
  }];
  const refolded = refoldLogEntries({
    log,
    mode: 'values',
    maxSize: 1000,
  });
  return (
    refolded.length === 1 &&
    refolded[0].valueToString === 'false' &&
    refolded[0].hits === 3
  );
}
function testValuesKeepsOneEntryPerValue() {
  // `values` folds per distinct offending value with the newest content per
  // slot, so a switch away from `full` keeps every value the log saw.
  const log = [{
    key: 'a',
    valueToString: 'false',
    hits: 1,
    message: 'first',
  }, {
    key: 'a',
    valueToString: 'undef',
    hits: 1,
    message: 'second',
  }, {
    key: 'a',
    valueToString: 'false',
    hits: 1,
    message: 'third',
  }];
  const refolded = refoldLogEntries({
    log,
    mode: 'values',
    maxSize: 1000,
  });
  return (
    refolded.length === 2 &&
    refolded[0].valueToString === 'false' &&
    refolded[0].message === 'third' &&
    refolded[0].hits === 1 &&
    refolded[1].valueToString === 'undef' &&
    refolded[1].hits === 1
  );
}
function testMissingHitsCountsOne() {
  // Legacy entries without `hits` still count their own firing when kept.
  const log = [{
    key: 'a',
  }, {
    key: 'b',
  }];
  const refolded = refoldLogEntries({
    log,
    mode: 'one',
    maxSize: 1000,
  });
  return (
    refolded.length === 2 &&
    refolded[0].hits === 1 &&
    refolded[1].hits === 1
  );
}
function testOverCapKeepsEveryKey() {
  // Over the ceiling the refold still keeps every key's surviving entry:
  // one distinct check outranks extra firings of a hot one.
  const log = [{
    key: 'quiet',
    hits: 5,
  }, {
    key: 'hot',
    hits: 1,
  }, {
    key: 'hot',
    hits: 1,
  }];
  const refolded = refoldLogEntries({
    log,
    mode: 'one',
    maxSize: 2,
  });
  return (
    refolded.length === 2 &&
    refolded[0].key === 'quiet' &&
    refolded[1].key === 'hot'
  );
}
function testHostileInputYieldsCopy() {
  // A hostile log never breaks the mode switch: the download keeps going
  // with a best-effort copy.
  const refolded = refoldLogEntries({
    log: null,
    mode: 'one',
    maxSize: 1000,
  });
  return Array.isArray(refolded) && refolded.length === 0;
}
const tests = [
  testFullKeepsEveryEntry,
  testOneKeepsLatestEntryPerKey,
  testOneStampsExactRowHits,
  testOneFoldingIsLossy,
  testValuesKeepsOneEntryPerValue,
  testMissingHitsCountsOne,
  testOverCapKeepsEveryKey,
  testHostileInputYieldsCopy,
];
export {tests};
