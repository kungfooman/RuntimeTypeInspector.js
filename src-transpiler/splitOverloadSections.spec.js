import {splitOverloadSections} from './splitOverloadSections.js';
import {deepEqualType} from '../src-runtime/deepEqualType.js';

// Stacked blocks preserve the implementation separately from the signatures.
function testStackedSections() {
  const blocks = ['@overload @param {number} x', '@overload @param {string} x', '@param {any} x'];
  const actual = splitOverloadSections(blocks);
  const expected = {overloads: [' @param {number} x', ' @param {string} x'], impl: '@param {any} x'};
  return deepEqualType(actual, expected);
}

// Return tags separate a single block's overloads from its implementation tail.
function testSingleBlockSections() {
  const src = `@overload
    @param {number} x
    @returns {number}
    @overload
    @param {string} x
    @returns {string}
    @param {any} x`;
  const result = splitOverloadSections([src]);
  return (
    result.overloads.length === 2 &&
    result.overloads[0].includes('{number}') &&
    result.overloads[1].includes('{string}') &&
    result.impl.includes('{any}')
  );
}

export const tests = [testStackedSections, testSingleBlockSections];
