import {stripBundlerSuffix} from './stripBundlerSuffix.js';
// A bundler-renamed duplicate shares no prototype chain with the expected
// spelling (`ContactEquation$4` vs `ContactEquation`), so the exact
// comparison rejects same-named values. The suffix check keeps forgeries
// out exactly like the exact check: the walk reads the real prototype
// chain, never an own `constructor` property.
function testRenamedDirectHit() {
  function Equation() {}
  Object.defineProperty(Equation, 'name', {
    value: 'Equation$6',
  });
  const value = new Equation();
  return stripBundlerSuffix(value.constructor.name) === 'Equation';
}
function testPlainNameUntouched() {
  return stripBundlerSuffix('Vec3') === 'Vec3' &&
    stripBundlerSuffix('Equation') === 'Equation';
}
function testOnlyTrailingDigitsStrip() {
  return stripBundlerSuffix('A$B') === 'A$B' &&
    stripBundlerSuffix('A$1B') === 'A$1B' &&
    stripBundlerSuffix('A$12') === 'A';
}
const tests = [
  testRenamedDirectHit,
  testPlainNameUntouched,
  testOnlyTrailingDigitsStrip,
];
export {tests};
