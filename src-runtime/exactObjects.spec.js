import {options} from './options.js';
import {validateType} from './validateType.js';
import {expandType} from '../src-transpiler/expandType.js';
const warn = () => undefined;
/**
 * Runs a check with `exactObjects` forced to a value, restoring after.
 * @param {boolean} exact - The flag value during the check.
 * @param {Function} fn - The check returning boolean.
 * @returns {boolean} The check result.
 */
function withExact(exact, fn) {
  const prev = options.exactObjects;
  options.exactObjects = exact;
  try {
    return fn();
  } finally {
    options.exactObjects = prev;
  }
}
function testOnByDefault() {
  const prev = options.exactObjects;
  options.exactObjects = true;
  let ret;
  try {
    ret = validateType({a: 1, extra: true},
                       expandType('{a: number}'), 'loc', 'name', true, warn, 0) === false;
  } finally {
    options.exactObjects = prev;
  }
  return ret && prev === true;
}
function testOffWhenDisabled() {
  return withExact(false, () => validateType({a: 1, extra: true},
                                             expandType('{a: number}'), 'loc', 'name', true, warn, 0));
}
function testExcessFailsWhenExact() {
  return withExact(true, () => validateType({a: 1, extra: true},
                                            expandType('{a: number}'), 'loc', 'name', true, warn, 0) === false);
}
function testExactPassesClean() {
  return withExact(true, () => validateType({a: 1},
                                            expandType('{a: number}'), 'loc', 'name', true, warn, 0));
}
function testNestedExcessFails() {
  return withExact(true, () => validateType({sub: {a: 1, extra: 2}},
                                            expandType('{sub: {a: number}}'), 'loc', 'name', true, warn, 0) === false);
}
function testUnionPicksCleanMember() {
  // Excess in one member must not poison the other: `{a}` still matches.
  return withExact(true, () => validateType({a: 1},
                                            expandType('{a: number} | {b: string}'), 'loc', 'name', true, warn, 0));
}
function testExcessMessageNamesKey() {
  return withExact(true, () => {
    const messages = [];
    validateType({a: 1, bogus: 2}, expandType('{a: number}'),
                 'loc', 'name', true, (...args) => messages.push(args[0]), 0);
    return messages.some((_) => typeof _ === 'string' && _.includes('bogus'));
  });
}
function testProfilerHintStillIgnored() {
  return withExact(true, () => validateType({a: 1, profilerHint: 'x'},
                                            expandType('{a: number}'), 'loc', 'name', true, warn, 0));
}
const tests = [
  testOnByDefault,
  testOffWhenDisabled,
  testExcessFailsWhenExact,
  testExactPassesClean,
  testNestedExcessFails,
  testUnionPicksCleanMember,
  testExcessMessageNamesKey,
  testProfilerHintStillIgnored,
];
export {tests};
