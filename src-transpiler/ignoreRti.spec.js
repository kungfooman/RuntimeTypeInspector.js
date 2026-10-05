import {parse} from '@babel/parser';
import {parserOptions} from './parserOptions.js';
import {Asserter} from './Asserter.js';
import {expandType} from './expandType.js';
/**
 * Transpiles one snippet without the runtime header, silencing warnings.
 * @param {string} src - Source code with one function to convert.
 * @returns {string} Converted code.
 */
function convert(src) {
  const origWarn = console.warn;
  console.warn = () => undefined;
  try {
    const asserter = new Asserter({expandType, addHeader: false, filename: 'test.js'});
    return asserter.toSource(parse(src, parserOptions));
  } finally {
    console.warn = origWarn;
  }
}
function testBareTagSkipsWholeFunction() {
  // Control: a bare `@ignoreRTI` emits no checks at all.
  const out = convert('/**\n * @ignoreRTI\n * @param {any} value - The value.\n */\nfunction validate(value) {\n return true;\n}');
  return !out.includes('inspectType');
}
function testBacktickedTagSkipsWholeFunction() {
  // PlayCanvas regression (`src/index.rti.js` documents the tag as `` `@ignoreRTI` ``):
  // markdown backticks are formatting, not a param name, so the whole function stays unchecked.
  const out = convert('/**\n * `@ignoreRTI`\n * @param {any} value - The value.\n */\nfunction validate(value) {\n return true;\n}');
  return !out.includes('inspectType');
}
function testQuotedTagSkipsWholeFunction() {
  // Same formatting hazard with double quotes: `"@ignoreRTI"` is still a bare tag, not a param named `"`.
  const out = convert('/**\n * "@ignoreRTI"\n * @param {any} value - The value.\n */\nfunction validate(value) {\n return true;\n}');
  return !out.includes('inspectType');
}
function testValidatorShapeSkipsAllSevenParams() {
  // Full PlayCanvas validator shape: none of the seven documented params may gain a check,
  // because any single prologue `inspectType` re-enters `validateType` -> `customValidations` -> itself.
  const src = '/**\n * `@ignoreRTI`\n * @param {any} value - The value.\n * @param {*} expect - Expected type structure.\n * @param {string} loc - String like `BoundingBox#compute`.\n * @param {string} name - Name of the argument.\n * @param {boolean} critical - Only false for unions.\n * @param {console["warn"]} warn - Function to warn with.\n * @param {number} depth - The depth to detect recursion.\n * @returns {boolean} Only false on NaN issues.\n */\nfunction validate(value, expect, loc, name, critical, warn, depth) {\n return true;\n}';
  const out = convert(src);
  return !out.includes('inspectType');
}
function testScopedTagSkipsOnlyListedParam() {
  // Control: `@ignoreRTI vertices` suppresses only that param while siblings keep validating.
  const src = '/**\n * @param {number} vertices - The vertices.\n * @param {number} used - Live entries.\n * @ignoreRTI vertices\n */\nfunction compute(vertices, used) {\n return used;\n}';
  const out = convert(src);
  if (out.includes("'vertices'")) {
    return false;
  }
  return out.includes("inspectType(used,");
}
function testUntaggedFunctionStillChecked() {
  // Control: without any tag the documented param is checked as usual.
  const out = convert('/**\n * @param {number} value - The value.\n */\nfunction validate(value) {\n return true;\n}');
  return out.includes("inspectType(value,");
}
export const tests = [
  testBareTagSkipsWholeFunction,
  testBacktickedTagSkipsWholeFunction,
  testQuotedTagSkipsWholeFunction,
  testValidatorShapeSkipsAllSevenParams,
  testScopedTagSkipsOnlyListedParam,
  testUntaggedFunctionStillChecked,
];
