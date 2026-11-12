import {tsTemplateTag} from './tsTemplateTag.js';
// A bare binding keeps its name with no constraint or default.
function testBareBindingKeepsName() {
  const rows = tsTemplateTag({typeParameters: [{getText: () => 'K'}]});
  return rows.length === 1 && rows[0].name === 'K' && rows[0].constraint === '' && rows[0].default === '';
}
// A bracketed binding with a default splits name and default apart.
function testBracketedBindingSplitsDefault() {
  const rows = tsTemplateTag({typeParameters: [{getText: () => '[K=string]'}]});
  return rows.length === 1 && rows[0].name === 'K' && rows[0].default === 'string';
}
// A constrained binding carries the braced constraint text.
function testConstrainedBindingCarriesConstraint() {
  const rows = tsTemplateTag({
    typeParameters: [{getText: () => '[K=string]'}],
    constraint: {getText: () => '{string}'},
  });
  return rows.length === 1 && rows[0].name === 'K' && rows[0].constraint === 'string' && rows[0].default === 'string';
}
// A multi-name template list reads one row per binding, like tsc.
function testTemplateListReadsEachBinding() {
  const tag = {typeParameters: [{getText: () => 'O'}, {getText: () => 'P'}]};
  const rows = tsTemplateTag(tag);
  return rows.length === 2 && rows[0].name === 'O' && rows[1].name === 'P';
}
// A spaced `=` binding splits name from default, like tsc.
function testSpacedDefaultBindingSplits() {
  const rows = tsTemplateTag({typeParameters: [{getText: () => '[EventMap = any]'}]});
  return rows.length === 1 && rows[0].name === 'EventMap' && rows[0].default === 'any';
}
// A tilde-truncated constraint recovers the raw rows: tsc drops the
// binding along with the constraint, so the head after the constraint
// reads the depfree way.
function testTildeConstraintRecoversBinding() {
  const tag = {
    getText: () => '@template {X~Y} [K=x]',
    typeParameters: [],
    constraint: {getText: () => '{X'},
  };
  const rows = tsTemplateTag(tag);
  return rows.length === 1 && rows[0].name === 'K' && rows[0].constraint === 'X~Y' && rows[0].default === 'x';
}
export const tests = [testBareBindingKeepsName, testBracketedBindingSplitsDefault, testConstrainedBindingCarriesConstraint, testTemplateListReadsEachBinding, testSpacedDefaultBindingSplits, testTildeConstraintRecoversBinding];
