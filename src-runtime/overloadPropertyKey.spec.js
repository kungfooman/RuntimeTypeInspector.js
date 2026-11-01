import {overloadPropertyKey} from './overloadPropertyKey.js';

// Key coercion uses the string hint once and preserves the resulting symbol.
function testCoercionAndSymbol() {
  const symbol = Symbol('key');
  const hints = [];
  const input = {
    [Symbol.toPrimitive](hint) {
      hints.push(hint);
      return symbol;
    }
  };
  const key = overloadPropertyKey(input);
  return (
    key === symbol &&
    hints.length === 1 &&
    hints[0] === 'string'
  );
}

// Numeric keys become their property-name strings.
function testNumberKey() {
  const key = overloadPropertyKey(42);
  return key === '42';
}

export const tests = [testCoercionAndSymbol, testNumberKey];
