import {splitTemplateBindings} from './splitTemplateBindings.js';

// A comma-separated list binds one row per name; trailing prose falls away.
function testCommaListBindsEachName() {
  const actual = splitTemplateBindings('O, P The obj and props types');
  return actual.length === 2 && actual[0] === 'O' && actual[1] === 'P';
}

// A comma inside a bracketed default never splits the binding.
function testBracketedDefaultKeepsInnerComma() {
  const actual = splitTemplateBindings('[K=Map<A, B>]');
  return actual.length === 1 && actual[0] === '[K=Map<A, B>]';
}

// A space inside a bracketed binding never splits it either.
function testBracketedBindingKeepsInnerSpace() {
  const actual = splitTemplateBindings('[EventMap = any]');
  return actual.length === 1 && actual[0] === '[EventMap = any]';
}

// Trailing prose after a bracketed binding falls away.
function testBracketedBindingDropsTrailingProse() {
  const actual = splitTemplateBindings('[T=Map<any, any>] blah');
  return actual.length === 1 && actual[0] === '[T=Map<any, any>]';
}

// A leading braced constraint is content the braced reader already took,
// not a binding.
function testLeadingConstraintFallsAway() {
  const actual = splitTemplateBindings('{Record<string, any>} [EventMap = any]');
  return actual.length === 1 && actual[0] === '[EventMap = any]';
}

// A bare name with no commas binds alone.
function testBareNameBindsAlone() {
  return JSON.stringify(splitTemplateBindings('K')) === JSON.stringify(['K']);
}

export const tests = [
  testCommaListBindsEachName,
  testBracketedDefaultKeepsInnerComma,
  testBracketedBindingKeepsInnerSpace,
  testBracketedBindingDropsTrailingProse,
  testLeadingConstraintFallsAway,
  testBareNameBindsAlone,
];
