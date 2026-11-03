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

// A section-local template survives the mapping: dropping it breaks joint
// inference downstream (the overloads fixture warns twice more without it).
function testOwnTemplateSurvivesMapping() {
  const fnNode = {params: [{type: 'Identifier', name: 'first'}]};
  const sections = ['@overload @template {string} T @param {T} first'];
  const signatures = overloadSignatures(sections, fnNode, {});
  const templates = signatures[0].templates;
  return (
    templates !== undefined &&
    templates.T === 'string'
  );
}

// Section templates shadow scope templates on conflict, and scope-only
// names pass through untouched.
function testOwnTemplateShadowsScope() {
  const fnNode = {params: []};
  const sections = ['@overload @template {number} T'];
  const scopeTemplates = {T: 'string', U: 'boolean'};
  const signatures = overloadSignatures(sections, fnNode, {scopeTemplates});
  const templates = signatures[0].templates;
  return (
    templates.T === 'number' &&
    templates.U === 'boolean'
  );
}

export const tests = [testEmptyBuildsNothing, testSingleSectionBuildsTuple, testOwnTemplateSurvivesMapping, testOwnTemplateShadowsScope];
