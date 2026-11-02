import {overloadSignatures} from './overloadSignatures.js';

// Empty overloads build no signatures.
function testEmptyBuildsNothing() {
  const fnNode = {params: []};
  return overloadSignatures([], fnNode, {}).length === 0;
}

// One well-formed section builds one runtime signature.
function testSingleSectionBuildsTuple() {
  const fnNode = {params: [{type: 'Identifier', name: 'value'}]};
  const sections = ['@overload @param {number} value'];
  const signatures = overloadSignatures(sections, fnNode, {});
  const tuple = signatures[0].tuple;
  const elements = tuple.elements;
  return (
    signatures.length === 1 &&
    elements.length === 1 &&
    elements[0].name === 'value'
  );
}

export const tests = [testEmptyBuildsNothing, testSingleSectionBuildsTuple];
