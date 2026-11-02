import {overloadImplParams} from './overloadImplParams.js';

// A missing implementation section parses to nothing.
function testMissingImplParsesNothing() {
  return overloadImplParams(null, {}) === undefined;
}

// An implementation section parses to its parameter map.
function testImplParsesParams() {
  const parsed = overloadImplParams('@param {number} value', {});
  const value = parsed && parsed.value;
  return value === 'number';
}

export const tests = [testMissingImplParsesNothing, testImplParsesParams];
