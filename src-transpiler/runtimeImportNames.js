/**
 * Local names a file already imports from the runtime package: only exact
 * same-module, non-aliased bindings (`import {registerTypedef} from ...`,
 * never `import {x as y}` or other specifiers), so skipping them in the
 * header can only remove a true duplicate.
 * @param {import('@babel/types').File|import('@babel/types').Program} ast - The parsed program.
 * @returns {Set<string>} Already-imported runtime names.
 * @example
 * runtimeImportNames(parse("import {registerTypedef} from '@runtime-type-inspector/runtime';")); // Set {'registerTypedef'}
 */
function runtimeImportNames(ast) {
  const found = new Set();
  const program = ast?.type === 'File' ? ast.program : ast;
  for (const node of program?.body ?? []) {
    if (node.type === 'ImportDeclaration' && node.source?.value === '@runtime-type-inspector/runtime') {
      for (const spec of node.specifiers ?? []) {
        if (spec.type === 'ImportSpecifier' && spec.imported?.type === 'Identifier' && spec.local?.type === 'Identifier' && spec.imported.name === spec.local.name) {
          found.add(spec.local.name);
        }
      }
    }
  }
  return found;
}
export {runtimeImportNames};
