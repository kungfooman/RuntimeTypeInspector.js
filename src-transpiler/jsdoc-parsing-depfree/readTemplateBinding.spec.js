import {readTemplateBinding} from './readTemplateBinding.js';

// A spaced `=` splits name from default, like tsc's binding.
function testSpacedDefaultSplits() {
  const actual = readTemplateBinding('[EventMap = any]');
  return actual.name === 'EventMap' && actual.default === 'any';
}

// A comma inside a default never splits the binding: the splitter owns
// commas, this reader owns the name.
function testDefaultKeepsInnerComma() {
  const actual = readTemplateBinding('[K=Map<A, B>]');
  return actual.name === 'K' && actual.default === 'Map<A, B>';
}

// A bare name binds whole with an empty default.
function testBareNameBindsWhole() {
  const actual = readTemplateBinding('K');
  return actual.name === 'K' && actual.default === '';
}

// A non-name never binds: the head word rides through for parity.
function testNonNameRidesThrough() {
  const actual = readTemplateBinding('[9=any]');
  return actual.name === '[9=any]' && actual.default === '';
}

export const tests = [
  testSpacedDefaultSplits,
  testDefaultKeepsInnerComma,
  testBareNameBindsWhole,
  testNonNameRidesThrough,
];
