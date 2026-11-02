import {eraseIgnoredOverloadParams} from './eraseIgnoredOverloadParams.js';

// A suppressed identifier parameter erases to any, keeping its position.
function testSuppressedIdentifierErases() {
  const tuple = {elements: [{name: 'value', elementType: 'number'}]};
  const fnNode = {params: [{type: 'Identifier', name: 'value'}]};
  const ignored = new Set(['value']);
  const actual = eraseIgnoredOverloadParams(tuple, fnNode, ignored);
  const element = actual.elements[0];
  return element.elementType === 'any';
}

// A missing tuple member leaves the tuple untouched.
function testMissingMemberSkips() {
  const tuple = {elements: []};
  const fnNode = {params: [{type: 'Identifier', name: 'value'}]};
  const ignored = new Set(['value']);
  const actual = eraseIgnoredOverloadParams(tuple, fnNode, ignored);
  return actual.elements.length === 0;
}

export const tests = [testSuppressedIdentifierErases, testMissingMemberSkips];
