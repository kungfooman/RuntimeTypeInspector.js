import {docTemplateNode} from './docTemplateNode.js';

// A bare template binds its name with the brace text as constraint.
function testBareTemplateBindsName() {
  const row = docTemplateNode({typeRaw: 'string', headRaw: 'K'});
  return row.name === 'K' && row.constraint === 'string' && row.default === '';
}

// A bracketed template splits the default off the binding name.
function testBracketedTemplateSplitsDefault() {
  const row = docTemplateNode({typeRaw: 'string', headRaw: '[K=string]'});
  return row.name === 'K' && row.constraint === 'string' && row.default === 'string';
}

// Only the first head token binds: trailing prose falls away.
function testTemplateHeadKeepsFirstToken() {
  const row = docTemplateNode({typeRaw: '', headRaw: 'K trailing words'});
  return row.name === 'K' && row.constraint === '' && row.default === '';
}

// A bracketed template without a default binds with an empty default.
function testBracketedTemplateWithoutDefault() {
  const row = docTemplateNode({typeRaw: 'string', headRaw: '[K] trailing'});
  return row.name === 'K' && row.constraint === 'string' && row.default === '';
}

export const tests = [
  testBareTemplateBindsName,
  testBracketedTemplateSplitsDefault,
  testTemplateHeadKeepsFirstToken,
  testBracketedTemplateWithoutDefault,
];
