import {parse} from '@babel/parser';
import {parserOptions} from './parserOptions.js';
import {runtimeImportNames} from './runtimeImportNames.js';
/**
 * Collects runtime import names from source.
 * @param {string} src - Source code to scan.
 * @returns {Set<string>} Already-imported runtime names.
 */
function namesFor(src) {
  return runtimeImportNames(parse(src, parserOptions));
}
function testDirectImportFound() {
  // A direct same-module import is collected.
  const found = namesFor("import {registerTypedef} from '@runtime-type-inspector/runtime';");
  return found.has('registerTypedef') && found.size === 1;
}
function testAliasedImportSkipped() {
  // Aliased bindings might name another thing: never collect them.
  return namesFor("import {registerTypedef as rt} from '@runtime-type-inspector/runtime';").size === 0;
}
function testForeignModuleSkipped() {
  // Same name from another module is another binding entirely.
  return namesFor("import {registerTypedef} from './elsewhere.js';").size === 0;
}
function testNoImportsEmpty() {
  // Files without imports yield nothing, never crash on missing programs.
  return namesFor('const x = 1;').size === 0 && runtimeImportNames(null).size === 0;
}
export const tests = [
  testDirectImportFound,
  testAliasedImportSkipped,
  testForeignModuleSkipped,
  testNoImportsEmpty,
];
