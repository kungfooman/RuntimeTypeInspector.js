import {setOverloadArrowLength} from './setOverloadArrowLength.js';

// Restoring length keeps the function identity and its configurable descriptor.
function testRestoredArrowLength() {
  const fn = (...args) => args;
  const result = setOverloadArrowLength(fn, 2);
  const descriptor = Object.getOwnPropertyDescriptor(fn, 'length');
  return (
    result === fn &&
    result.length === 2 &&
    descriptor.configurable === true
  );
}

export const tests = [testRestoredArrowLength];
