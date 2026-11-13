import {runChecks} from './runChecks.js';
// Class creation still runs the key expression exactly once per
// definition: coercion happens at class-evaluation time, before any
// instance exists, with no extra reads from the new capture.
function testComputedFieldEvaluatesKeyOncePerClass() {
  const src = `let reads = 0;
  function make(key) {
    return class {
      /** @overload @param {number} value @returns {number} */
      /** @param {number|string} value */
      [key] = (value) => typeof value === 'number' ? value : 0;
    };
  }
  const key = {
    toString() {
      reads++;
      return 'once';
    }
  };
  const Made = make(key);
  const afterDef = reads;`;
  return runChecks(src, 'afterDef', (scope) => scope.afterDef === 1);
}
// Reentrant class creation keeps each class on its own key: a key whose
// coercion builds the next class still binds the outer class first, and
// both instances then check, name, and implement independently. Counts add
// two coercions per instance along the capture path (field key per shape,
// then the per-instance key into the capture), so two instances of two
// classes built this way total eight coercions.
function testComputedFieldSurvivesReentrantClassCreation() {
  const src = `let reads = 0;
  function make(key) {
    return class {
      /** @overload @param {number} value @returns {number} */
      /** @param {number|string} value */
      [key] = (value) => typeof value === 'number' ? value : 0;
    };
  }
  const outerKey = {
    toString() {
      reads++;
      innerMade = make(innerKey);
      return 'outer';
    }
  };
  const innerKey = {
    toString() {
      reads++;
      return 'inner';
    }
  };
  let innerMade = null;
  const Outer = make(outerKey);
  const afterBoth = reads;
  const outer = new Outer();
  const afterOuter = reads;
  const inner = new innerMade();
  const afterInner = reads;
  if (outer.outer('bad') !== 0) throw new Error('Outer rejects strings');
  if (inner.inner('bad') !== 0) throw new Error('Inner rejects strings');`;
  return runChecks(src, 'outer, inner, afterBoth, afterOuter, afterInner, reads', (scope, {hits}) => (
    scope.afterBoth === 2 &&
    scope.afterOuter === 6 &&
    scope.afterInner === 8 &&
    scope.reads === 8 &&
    scope.outer.outer.name === 'outer' &&
    scope.inner.inner.name === 'inner' &&
    scope.outer.outer.length === 1 &&
    scope.inner.inner.length === 1 &&
    scope.outer.outer(3) === 3 &&
    scope.inner.inner(4) === 4 &&
    hits.length === 2
  ));
}
// Two fields in one class keep definition order and independent values:
// each key coerces once at class evaluation, then twice more per instance
// along the capture path, so one instance totals six coercions.
function testComputedFieldInstancesCoerceOwnKeys() {
  const src = `const order = [];
  const firstKey = {
    toString() {
      order.push('firstKey');
      return 'first';
    }
  };
  const secondKey = {
    toString() {
      order.push('secondKey');
      return 'second';
    }
  };
  class Fields {
    /** @overload @param {number} value @returns {number} */
    /** @param {number|string} value */
    [firstKey] = (value) => 1;
    /** @overload @param {number} value @returns {number} */
    /** @param {number|string} value */
    [secondKey] = (value) => 2;
  }
  const marker = order.length;
  const fields = new Fields();`;
  return runChecks(src, 'fields, order, marker', (scope, {hits}) => (
    scope.marker === 2 &&
    scope.order.length === 6 &&
    scope.order[0] === 'firstKey' &&
    scope.order[1] === 'secondKey' &&
    scope.order[2] === 'firstKey' &&
    scope.order[3] === 'firstKey' &&
    scope.order[4] === 'secondKey' &&
    scope.order[5] === 'secondKey' &&
    scope.fields.first(1) === 1 &&
    scope.fields.second(2) === 2 &&
    scope.fields.first.name === 'first' &&
    scope.fields.second.name === 'second' &&
    hits.length === 0
  ));
}
// A static computed field coerces once at class definition, never per
// instance: constructing twice adds no reads, and the stored wrapper still
// checks with its coerced name and arity.
function testComputedStaticFieldEvaluatesOnce() {
  const src = `let reads = 0;
  const key = {
    toString() {
      reads++;
      return 'shared';
    }
  };
  class Fields {
    /** @overload @param {number} value @returns {number} */
    /** @param {number|string} value */
    static [key] = (value) => typeof value === 'number' ? value : 0;
  }
  const before = reads;
  const first = new Fields();
  const second = new Fields();
  const after = reads;
  Fields.shared('bad');`;
  return runChecks(src, 'Fields, before, after', (scope, {hits}) => (
    scope.before === 3 &&
    scope.after === 3 &&
    scope.Fields.shared.name === 'shared' &&
    scope.Fields.shared.length === 1 &&
    hits.length === 1
  ));
}
// A two-parameter field keeps arity two: the dummy head counts required
// params, so a wrong second argument still hits while the name holds.
function testComputedFieldKeepsMultiParamArity() {
  const src = `class Fields {
    /** @overload @param {number} first @param {string} second @returns {number} */
    /** @param {number|string} first @param {number|string} second */
    [String('pair')] = (first, second) => 1;
  }
  const fields = new Fields();
  fields.pair(1, 2);`;
  return runChecks(src, 'fields', (scope, {hits, posted}) => (
    scope.fields.pair.length === 2 &&
    scope.fields.pair.name === 'pair' &&
    hits.length === 1 &&
    posted[0].loc === 'Fields#String(\'pair\')'
  ));
}
export const tests = [
  testComputedFieldEvaluatesKeyOncePerClass,
  testComputedFieldSurvivesReentrantClassCreation,
  testComputedFieldInstancesCoerceOwnKeys,
  testComputedStaticFieldEvaluatesOnce,
  testComputedFieldKeepsMultiParamArity,
];
