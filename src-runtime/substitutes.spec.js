import {substituteType} from './substituteType.js';
import {substituteArray} from './substituteArray.js';
import {substituteRecord} from './substituteRecord.js';
import {substituteDescriptors} from './substituteDescriptors.js';
import {substitutes, recurseSubstitute} from './substitutes.js';
const noop = () => undefined;
/**
 * Runs `body` with one dispatch-table entry swapped, then restores the
 * pristine entry and reports both halves. Override tests share this
 * process-global table with every later test, so the no-leak check lives
 * here — against the imported original, not execution history — instead of
 * in a follow-up test that only passes when the array order cooperates.
 * @param {Record<string, Function>} table - The dispatch table to swap in.
 * @param {string} entry - The table key to swap (e.g. 'substituteType').
 * @param {Function} original - The pristine entry to restore (the import).
 * @param {Function} override - The temporary entry.
 * @param {Function} body - Assertions to run under the override.
 * @returns {boolean} True when the body passed and the original is back.
 */
function withOverride(table, entry, original, override, body) {
  table[entry] = override;
  let ret = false;
  try {
    ret = body() === true;
  } finally {
    table[entry] = original;
  }
  return ret && table[entry] === original;
}
function testTablePopulated() {
  // Importing substituteType.js fills every table entry with the real impl.
  return substitutes.substituteType === substituteType &&
    substitutes.substituteArray === substituteArray &&
    substitutes.substituteRecord === substituteRecord &&
    substitutes.substituteDescriptors === substituteDescriptors;
}
function testDispatcherDelegates() {
  // The dispatcher substitutes exactly like a direct call, across every
  // routing: single positions, records, sibling lists and descriptors.
  const tree = {
    type: 'object',
    properties: {
      a: 'K',
      els: {type: 'array', elementType: 'K'},
      u: {type: 'union', members: ['K', 'number']},
      f: {type: 'function', parameters: [{type: 'K', name: 'x'}]},
    },
  };
  const direct = substituteType(tree, 'K', '"a"', noop);
  const viaTable = recurseSubstitute(tree, 'K', '"a"', noop);
  return JSON.stringify(viaTable) === JSON.stringify(direct) &&
    viaTable.properties.a === '"a"' &&
    viaTable.properties.els.elementType === '"a"' &&
    viaTable.properties.u.members[0] === '"a"' &&
    viaTable.properties.f.parameters[0].type === '"a"';
}
function testDispatcherThrowsWhenUnregistered() {
  // Without a registered entry the dispatcher fails loudly instead of
  // silently producing undefined (asserts that it throws, not the wording).
  const keep = substitutes.substituteType;
  delete substitutes.substituteType;
  try {
    recurseSubstitute('K', 'K', '"a"', noop);
    return false;
  } catch {
    return true;
  } finally {
    substitutes.substituteType = keep;
  }
}
function testOverrideComposes() {
  // A userland override of the table entry applies to every nested position:
  // records, single positions, sibling lists and descriptors all recurse
  // through the dispatcher, not past it. The restore is asserted by
  // `withOverride`, so no later test can observe the swap.
  return withOverride(substitutes, 'substituteType', substituteType, (type, search, replace, warn) => {
    return type === 'K' ? '"winning"' : substituteType(type, search, replace, warn);
  }, () => {
    const out = substituteType({
      type: 'object',
      properties: {
        a: 'K',
        els: {type: 'array', elementType: 'K'},
        u: {type: 'union', members: ['K', 'number']},
        f: {type: 'function', parameters: [{type: 'K', name: 'x'}]},
      },
    }, 'K', '"a"', noop);
    return out.properties.a === '"winning"' &&
      out.properties.els.elementType === '"winning"' &&
      out.properties.u.members[0] === '"winning"' &&
      out.properties.f.parameters[0].type === '"winning"';
  });
}
const tests = [
  testTablePopulated,
  testDispatcherDelegates,
  testDispatcherThrowsWhenUnregistered,
  testOverrideComposes,
];
export {tests};
