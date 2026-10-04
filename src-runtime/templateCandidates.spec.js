import {resolveTemplateLiteralCandidates} from './resolveTemplateLiteralCandidates.js';
import {resolveTemplateLiteralValues} from './resolveTemplateLiteralValues.js';
import {templateCandidates, recurseCandidates} from './templateCandidates.js';
const noop = () => undefined;
function testTablePopulated() {
  // Importing the resolver module fills both table entries with the real impls.
  return templateCandidates.resolveTemplateLiteralCandidates === resolveTemplateLiteralCandidates &&
    templateCandidates.resolveTemplateLiteralValues === resolveTemplateLiteralValues;
}
function testDispatcherDelegates() {
  // The dispatcher enumerates exactly like a direct call, including unions.
  const direct = resolveTemplateLiteralCandidates({type: 'union', members: ['"a"', '"b"']}, noop);
  const viaTable = recurseCandidates({type: 'union', members: ['"a"', '"b"']}, noop);
  return JSON.stringify(viaTable) === JSON.stringify(direct) && JSON.stringify(viaTable) === '["a","b"]';
}
function testDispatcherThrowsWhenUnregistered() {
  // Without a registered entry the dispatcher fails loudly instead of
  // silently producing undefined (asserts that it throws, not the wording).
  const keep = templateCandidates.resolveTemplateLiteralCandidates;
  delete templateCandidates.resolveTemplateLiteralCandidates;
  try {
    recurseCandidates('"en"', noop);
    return false;
  } catch {
    return true;
  } finally {
    templateCandidates.resolveTemplateLiteralCandidates = keep;
  }
}
function testOverrideComposes() {
  // A userland override of the table entry applies to every interpolated
  // slot: value expansion recurses through the dispatcher, not past it.
  const keep = templateCandidates.resolveTemplateLiteralCandidates;
  templateCandidates.resolveTemplateLiteralCandidates = () => ['OZ'];
  try {
    const values = resolveTemplateLiteralValues({quasis: ['a', 'b'], types: ['"x"']}, noop);
    return JSON.stringify(values) === '["aOZb"]';
  } finally {
    templateCandidates.resolveTemplateLiteralCandidates = keep;
  }
}
function testOverrideRestored() {
  // The previous test left no trace: defaults are back in the table.
  return templateCandidates.resolveTemplateLiteralCandidates === resolveTemplateLiteralCandidates &&
    JSON.stringify(resolveTemplateLiteralValues({quasis: ['a', 'b'], types: ['"x"']}, noop)) === '["axb"]';
}
const tests = [
  testTablePopulated,
  testDispatcherDelegates,
  testDispatcherThrowsWhenUnregistered,
  testOverrideComposes,
  testOverrideRestored,
];
export {tests};
