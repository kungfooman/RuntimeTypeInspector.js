import {Warning} from './Warning.js';
import {options} from './options.js';
/**
 * Stub the console group/error methods so we can assert how a warning is logged.
 * @typedef {Object} ConsoleCalls
 * @property {Array<{name: string, args: unknown[]}>} calls - The recorded console calls.
 */
/**
 * Replace the console methods used by Warning#logWarning with stubs that record
 * every call, so the test can verify ordering and arguments.
 * @returns {() => void} Restores the original console methods.
 */
function stubConsole() {
  const original = {
    groupCollapsed: console.groupCollapsed,
    groupEnd: console.groupEnd,
    error: console.error,
  };
  /** @type {ConsoleCalls['calls']} */
  const calls = [];
  console.groupCollapsed = (...args) => calls.push({name: 'groupCollapsed', args});
  console.error = (...args) => calls.push({name: 'error', args});
  console.groupEnd = () => calls.push({name: 'groupEnd', args: []});
  return () => {
    console.groupCollapsed = original.groupCollapsed;
    console.error = original.error;
    console.groupEnd = original.groupEnd;
    return calls;
  };
}
/**
 * Build a Warning-like instance without touching the DOM: warn/logWarning only
 * read `options`, `hidden`, `hits` and `logWarning`, all prototype members.
 * @returns {Warning} A minimal Warning instance.
 */
function makeWarning() {
  const warning = Object.create(Warning.prototype);
  warning._hits = 0;
  return warning;
}
/**
 * Run a test with a given options mode, restoring the original mode afterwards.
 * @param {'spam'|'once'|'never'} mode - The options.mode to use during the test.
 * @param {() => boolean} test - The test function.
 * @returns {boolean} The test result.
 */
function withMode(mode, test) {
  const previous = options.mode;
  options.mode = mode;
  const ret = test();
  options.mode = previous;
  return ret;
}
function test1() {
  // spam mode logs every warning as a single collapsed group row
  return withMode('spam', () => {
    const restore = stubConsole();
    const warning = makeWarning();
    warning._hits = 1;
    warning.warn('the message', {expect: 'object'});
    const calls = restore();
    if (JSON.stringify(calls.map(_ => _.name)) !== JSON.stringify(['groupCollapsed', 'error', 'groupEnd'])) {
      return false;
    }
    return calls[0].args[0] === 'the message' && calls[1].args[0].expect === 'object';
  });
}
function test2() {
  // once mode logs only when hits equals one,
  // mirroring TypePanel.addError which increments hits before warn()
  return withMode('once', () => {
    const warning = makeWarning();
    const restore = stubConsole();
    warning._hits++; // first occurrence
    warning.warn('first');
    const calls = restore();
    if (calls.length !== 3 || calls[0].name !== 'groupCollapsed') {
      return false;
    }
    const restore2 = stubConsole();
    warning._hits++; // second occurrence
    warning.warn('second');
    const calls2 = restore2();
    return calls2.length === 0;
  });
}
function test3() {
  // never mode logs nothing at all
  return withMode('never', () => {
    const restore = stubConsole();
    const warning = makeWarning();
    warning._hits = 1;
    warning.warn('nope');
    const calls = restore();
    return calls.length === 0;
  });
}
function test4() {
  // hidden warnings log nothing regardless of mode
  return withMode('spam', () => {
    const restore = stubConsole();
    const warning = makeWarning();
    warning._hidden = true;
    warning.warn('hidden message', {value: 42});
    const calls = restore();
    return calls.length === 0;
  });
}
function test5() {
  // group contains message as title and all extra data objects inside
  return withMode('spam', () => {
    const restore = stubConsole();
    const warning = makeWarning();
    warning.warn('row title', {a: 1}, {b: 2}, 'tail');
    const calls = restore();
    if (calls[0].name !== 'groupCollapsed' || calls[0].args[0] !== 'row title') {
      return false;
    }
    const extras = calls[1].args;
    return JSON.stringify(extras) === JSON.stringify([{a: 1}, {b: 2}, 'tail']);
  });
}
export const tests = [test1, test2, test3, test4, test5];
