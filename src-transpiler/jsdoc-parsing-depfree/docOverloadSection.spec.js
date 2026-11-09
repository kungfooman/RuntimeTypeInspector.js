import {docOverloadSection} from './docOverloadSection.js';

// One section lowers to its params plus its return type.
function testSectionLowersParamsAndReturn() {
  const entry = docOverloadSection('@param {string} label @param {...number[]} values @returns {number}');
  return (
    entry.params.length === 2 &&
    entry.params[0].name === 'label' &&
    entry.params[1].name === 'values' &&
    entry.params[1].type === '...number[]' &&
    entry.returns === 'number'
  );
}

// A section without a return lowers with an empty return, not undefined.
function testSectionWithoutReturnLowersEmpty() {
  const entry = docOverloadSection('@param {number} x');
  return entry.params.length === 1 && entry.returns === '';
}

// The `@return` spelling binds the same as `@returns`.
function testReturnSpellingBinds() {
  const entry = docOverloadSection('@param {number} x @return {string} extra');
  return entry.returns === 'string';
}

export const tests = [
  testSectionLowersParamsAndReturn,
  testSectionWithoutReturnLowersEmpty,
  testReturnSpellingBinds,
];
