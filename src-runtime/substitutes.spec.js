import {substituteType} from './substituteType.js';
import {substituteArray} from './substituteArray.js';
import {substituteRecord} from './substituteRecord.js';
import {substituteDescriptors} from './substituteDescriptors.js';
import {substitutes, recurseSubstitute} from './substitutes.js';
const noop = () => undefined;
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
  // through the dispatcher, not past it.
  const keep = substitutes.substituteType;
  substitutes.substituteType = (type, search, replace, warn) => {
    return type === 'K' ? '"winning"' : keep(type, search, replace, warn);
  };
  try {
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
  } finally {
    substitutes.substituteType = keep;
  }
}
function testOverrideRestored() {
  // The previous test left no trace: defaults are back in the table.
  return substitutes.substituteType === substituteType &&
    substituteType({type: 'array', elementType: 'K'}, 'K', '"a"', noop).elementType === '"a"';
}
const tests = [
  testTablePopulated,
  testDispatcherDelegates,
  testDispatcherThrowsWhenUnregistered,
  testOverrideComposes,
  testOverrideRestored,
];
export {tests};
