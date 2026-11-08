import {tsTemplateTag} from './tsTemplateTag.js';

// A bare binding keeps its name with no constraint or default.
function testBareBindingKeepsName() {
  const actual = tsTemplateTag({typeParameters: [{getText: () => 'K'}]});
  return actual.name === 'K' && actual.constraint === '' && actual.default === '';
}

// A bracketed binding with a default splits name and default apart.
function testBracketedBindingSplitsDefault() {
  const actual = tsTemplateTag({typeParameters: [{getText: () => '[K=string]'}]});
  return actual.name === 'K' && actual.default === 'string';
}

// A constrained binding carries the braced constraint text.
function testConstrainedBindingCarriesConstraint() {
  const actual = tsTemplateTag({typeParameters: [{getText: () => '[K=string]'}], constraint: {getText: () => '{string}'}});
  return actual.name === 'K' && actual.constraint === 'string' && actual.default === 'string';
}

export const tests = [testBareBindingKeepsName, testBracketedBindingSplitsDefault, testConstrainedBindingCarriesConstraint];
