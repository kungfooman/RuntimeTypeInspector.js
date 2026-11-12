import {docTemplateNode} from './docTemplateNode.js';
// A bare comma list reads as two rows with no constraint.
function testCommaListBindsEachName() {
  const actual = docTemplateNode({typeRaw: '', headRaw: 'O, P The obj and props types'});
  return (
    actual.length === 2 &&
    actual[0].name === 'O' &&
    actual[1].name === 'P' &&
    actual[0].constraint === '' &&
    actual[1].constraint === ''
  );
}
// Each list member carries the braced constraint.
function testCommaListCarriesConstraint() {
  const actual = docTemplateNode({typeRaw: 'string', headRaw: 'O, P prose'});
  return (
    actual.length === 2 &&
    actual[0].constraint === 'string' &&
    actual[1].constraint === 'string'
  );
}
// A bare template binds its name with the brace text as constraint.
function testBareTemplateBindsName() {
  const rows = docTemplateNode({typeRaw: 'string', headRaw: 'K'});
  return (
    rows.length === 1 &&
    rows[0].name === 'K' &&
    rows[0].constraint === 'string' &&
    rows[0].default === ''
  );
}
// A bracketed template splits the default off the binding name.
function testBracketedTemplateSplitsDefault() {
  const rows = docTemplateNode({typeRaw: 'string', headRaw: '[K=string]'});
  return (
    rows.length === 1 &&
    rows[0].name === 'K' &&
    rows[0].constraint === 'string' &&
    rows[0].default === 'string'
  );
}
// Only the first head token binds: trailing prose falls away.
function testTemplateHeadKeepsFirstToken() {
  const rows = docTemplateNode({typeRaw: '', headRaw: 'K trailing words'});
  return (
    rows.length === 1 &&
    rows[0].name === 'K' &&
    rows[0].constraint === '' &&
    rows[0].default === ''
  );
}
// A bracketed template without a default binds with an empty default.
function testBracketedTemplateWithoutDefault() {
  const rows = docTemplateNode({typeRaw: 'string', headRaw: '[K] trailing'});
  return (
    rows.length === 1 &&
    rows[0].name === 'K' &&
    rows[0].constraint === 'string' &&
    rows[0].default === ''
  );
}
export const tests = [
  testBareTemplateBindsName,
  testBracketedTemplateSplitsDefault,
  testTemplateHeadKeepsFirstToken,
  testBracketedTemplateWithoutDefault,
  testCommaListBindsEachName,
  testCommaListCarriesConstraint,
];
