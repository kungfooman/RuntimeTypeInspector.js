import {overloadInvocation} from './overloadInvocation.js';

// The invocation suffix forwards the stored invocation list.
function testInvocationForwardsStoredList() {
  const call = 'rtiParam0, ...rtiParam1';
  const wrapper = {invocation: call};
  const actual = overloadInvocation(wrapper);
  const expected = ')(' + call + ')}';
  return actual === expected;
}

// A missing wrapper renders no invocation suffix.
function testInvocationWithoutWrapper() {
  const actual = overloadInvocation(null);
  return actual === '';
}

export const tests = [testInvocationForwardsStoredList, testInvocationWithoutWrapper];
