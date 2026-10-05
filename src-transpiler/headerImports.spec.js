import {parse} from '@babel/parser';
import {parserOptions} from './parserOptions.js';
import {Asserter} from './Asserter.js';
import {expandType} from './expandType.js';
const legacyHeader = "import {inspectIndexedAccess, inspectType, inspectTypeWithTemplates, youCanAddABreakpointHere, registerVariable, validateDivision, registerTypedef, registerClass, registerImportNamespaceSpecifier} from '@runtime-type-inspector/runtime';";
/**
 * Transpiles one snippet with the header enabled.
 * @param {string} src - Source code to convert.
 * @returns {string} Converted code with header.
 */
function convert(src) {
  const asserter = new Asserter({expandType, filename: 'test.js'});
  const ast = parse(src, parserOptions);
  return asserter.getHeader(ast) + asserter.toSource(ast);
}
/**
 * Finds the emitted runtime import line.
 * @param {string} out - Converted code.
 * @returns {string|undefined} The header import line, if any.
 */
function headerLine(out) {
  return out.split('\n').find((line) => line.startsWith('import {') && line.includes('@runtime-type-inspector/runtime'));
}
function testOwnRuntimeImportOmitted() {
  // A file importing a runtime helper itself gets no second binding for it:
  // the header drops that name while keeping the rest, so bundlers see each
  // binding once and the helper stays usable.
  const out = convert("import {registerTypedef} from '@runtime-type-inspector/runtime';\n/** @param {number} x - The value. */\nfunction takeIt(x) {\n return x;\n}");
  const header = headerLine(out);
  return header !== undefined && !header.includes('registerTypedef') && header.includes('inspectType') &&
    out.includes("import {registerTypedef} from '@runtime-type-inspector/runtime';");
}
function testUnrelatedFileHeaderUnchanged() {
  // Files without own runtime imports get the exact legacy header.
  const out = convert("/** @param {number} x - The value. */\nfunction takeIt(x) {\n return x;\n}");
  return headerLine(out) === legacyHeader;
}
function testAliasedImportKeepsHeader() {
  // Conservative: an aliased binding (`as rt`) might name another thing, so
  // the header keeps its own import and stays loud instead of miswiring.
  const out = convert("import {registerTypedef as rt} from '@runtime-type-inspector/runtime';\n/** @param {number} x - The value. */\nfunction takeIt(x) {\n return x;\n}");
  return headerLine(out) === legacyHeader;
}
function testForeignModuleImportKeepsHeader() {
  // Same name from another module is another binding: the header keeps its
  // own import rather than silently calling the foreign one.
  const out = convert("import {registerTypedef} from './elsewhere.js';\n/** @param {number} x - The value. */\nfunction takeIt(x) {\n return x;\n}");
  return headerLine(out) === legacyHeader;
}
function testNoArgHeaderUnchanged() {
  // Old callers passing no AST get the full legacy header (backward compat).
  const asserter = new Asserter({expandType, filename: 'test.js'});
  return asserter.getHeader().split('\n').find((line) => line.startsWith('import {')) === legacyHeader;
}
function testExportStarUnaffected() {
  // Re-exports bind nothing locally, so the header stays complete.
  const out = convert("export * from '@runtime-type-inspector/runtime';\n/** @param {number} x - The value. */\nfunction takeIt(x) {\n return x;\n}");
  return headerLine(out) === legacyHeader;
}
export const tests = [
  testOwnRuntimeImportOmitted,
  testUnrelatedFileHeaderUnchanged,
  testAliasedImportKeepsHeader,
  testForeignModuleImportKeepsHeader,
  testNoArgHeaderUnchanged,
  testExportStarUnaffected,
];
