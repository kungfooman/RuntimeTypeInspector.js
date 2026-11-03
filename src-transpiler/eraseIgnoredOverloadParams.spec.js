import {parse} from '@babel/parser';
import {eraseIgnoredOverloadParams} from './eraseIgnoredOverloadParams.js';
import {overloadToTuple} from './overloadToTuple.js';

// A suppressed identifier parameter erases to any, keeping its position.
function testSuppressedIdentifierErases() {
  // input: {elements: [{type: 'tupleMember', name: 'value', elementType: 'number'}]}
  // overloadToTuple('@param {number} value') builds this shape through
  // expandType, the same producer path production code feeds the eraser.
  const tuple = overloadToTuple('@param {number} value');
  const ast = parse('function f(value) { return value; }');
  const fnNode = ast.program.body[0];
  const ignored = new Set(['value']);
  const actual = eraseIgnoredOverloadParams(tuple, fnNode, ignored);
  const element = actual.elements[0];
  return element.elementType === 'any';
}

// A missing tuple member leaves the tuple untouched.
function testMissingMemberSkips() {
  // input: {elements: []}
  // overloadToTuple('@param {string} other') also builds an empty tuple here:
  // parseJSDoc yields no member matching this fnNode's param, so the eraser
  // finds nothing to erase, same as the hand-built empty tuple below.
  const tuple = {elements: []};
  const ast = parse('function f(value) { return value; }');
  const fnNode = ast.program.body[0];
  const ignored = new Set(['value']);
  const actual = eraseIgnoredOverloadParams(tuple, fnNode, ignored);
  return actual.elements.length === 0;
}

export const tests = [testSuppressedIdentifierErases, testMissingMemberSkips];
