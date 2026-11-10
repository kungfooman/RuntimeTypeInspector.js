import {docReaderDepFree} from './docReaderDepFree.js';
import {docReaderTS} from '../jsdoc-parsing-ts/docReaderTS.js';
import {expandTypeDepFree} from '../expandTypeDepFree.js';
import {expandType} from '../expandType.js';
import {validateType} from '../../src-runtime/validateType.js';
import {deepEqualType} from '../../src-runtime/deepEqualType.js';
const warn = () => undefined;
const bare = '@callback HandleEventCallback\n@param {any} [arg1] - First argument.\n@returns {void}';

// Both readers bind the trailing `@returns` the same way: the TS
// signature carries the return as its own node, which the TS reader
// surfaces like the depfree flat `@returns` row does.
function testCallbackReturnReadsBothSides() {
  const actual = docReaderDepFree(bare);
  const expected = docReaderTS(bare);
  return actual.returns === 'void' && expected.returns === 'void';
}

// End-to-end: the bound `void` expands identically on both parsers and
// validates like `void` should (only `undefined` passes).
function testCallbackReturnValidates() {
  const fromDepFree = expandTypeDepFree(docReaderDepFree(bare).returns);
  const fromTS = expandType(docReaderTS(bare).returns);
  if (!deepEqualType(fromDepFree, fromTS)) {
    return false;
  }
  if (!validateType(undefined, fromDepFree, 'test', 'a', true, warn, 0)) {
    return false;
  }
  if (validateType(1, fromDepFree, 'test', 'a', true, warn, 0)) {
    return false;
  }
  return true;
}

// A nested `@template` dies with the TS signature (flat `@template` is
// order-blind on both sides), so the TS reader binds it from the tag
// source like the depfree row does: callbacks survive generic nesting.
function testCallbackNestedTemplateSurvives() {
  const input = '@callback G\n@param {T} x\n@template T\n@returns {T}';
  const actual = docReaderDepFree(input);
  const expected = docReaderTS(input);
  return (
    actual.templates.length === 1 &&
    actual.templates[0].name === 'T' &&
    expected.templates.length === 1 &&
    expected.templates[0].name === 'T' &&
    expected.callbacks.length === 1 &&
    expected.callbacks[0].params.length === 1
  );
}

// A dotted child merges into its container inside the TS signature, so
// the nested rows un-merge like the flat tail: container marked merged
// with re-sliced children, names and brackets pinned instead of text.
function testCallbackDottedChildUnmerges() {
  const input = '@callback O\n@param {object} opts\n@param {string} opts.name\n@returns {void}';
  const actual = docReaderTS(input);
  const entry = actual.callbacks[0];
  return (
    entry.params.length === 2 &&
    entry.params[0].name === 'opts' &&
    entry.params[0].merged === true &&
    entry.params[1].name === 'opts.name' &&
    entry.params[1].type === 'string' &&
    docReaderDepFree(input).callbacks[0].params[1].name === 'opts.name'
  );
}

// A leading `~` empties the TS return node, which `recoverTildeTag`
// declines: the callback form re-slices the raw group whole, matching
// the depfree row exactly instead of dropping the return.
function testCallbackTildeReturnRecovers() {
  const input = '@callback T\n@param {number} x\n@returns {~Foo}';
  const actual = docReaderDepFree(input);
  const expected = docReaderTS(input);
  return actual.returns === '~Foo' && expected.returns === '~Foo';
}

// An inline callback type (`@callback {function(...): ...} Fn`) has no
// name binding on either side: tsc holds the type with no `Fn`, so the
// depfree entry stays unnamed instead of splitting a brace fragment.
function testCallbackInlineTypeUnnamed() {
  const input = '@callback {function(number): void} Fn';
  const actual = docReaderDepFree(input);
  const expected = docReaderTS(input);
  return (
    actual.callbacks.length === 1 &&
    actual.callbacks[0].name === '' &&
    expected.callbacks.length === 1 &&
    expected.callbacks[0].name === ''
  );
}

// Two callbacks keep their own rows: the first callback's return does
// not leak into the second, and params group under the right entry.
function testCallbackSecondKeepsOwnRows() {
  const input = '@callback A\n@param {number} x\n@returns {void}\n@callback B\n@param {string} y\n@returns {number}';
  const actual = docReaderDepFree(input);
  const expected = docReaderTS(input);
  return (
    actual.returns === 'number' &&
    expected.returns === 'number' &&
    actual.callbacks.length === 2 &&
    expected.callbacks.length === 2 &&
    actual.callbacks[1].params[0].name === 'y' &&
    expected.callbacks[1].params[0].name === 'y'
  );
}

export const tests = [
  testCallbackReturnReadsBothSides,
  testCallbackReturnValidates,
  testCallbackNestedTemplateSurvives,
  testCallbackDottedChildUnmerges,
  testCallbackTildeReturnRecovers,
  testCallbackInlineTypeUnnamed,
  testCallbackSecondKeepsOwnRows,
];
