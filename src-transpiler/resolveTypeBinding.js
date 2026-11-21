/**
 * Resolves a bare type name to a live in-scope binding expression.
 *
 * Walks `parents` (root-first, like `locateObjectOwner`) collecting
 * lexical declarations visible at `node`: `import {X}`, top-level and
 * nested `function X`, `class X`, `const/let/var X = ...`, `catch (X)`
 * is skipped (a value, not a constructor), function params are skipped
 * the same way. Inner scopes shadow outer ones; the nearest declaration
 * wins. Returns the source text of a reference expression valid at the
 * check site, or undefined when nothing usable is in scope.
 *
 * Only bare identifiers resolve (`Vec`, not `NS.Vec`, not `a.b`): member
 * expressions would need scope-aware base resolution plus a guarantee the
 * property read is side-effect free, which this pass does not attempt.
 * Destructured `const {Vec} = require(...)` still declares `Vec`, so it
 * resolves like any other binding.
 *
 * @param {object} asserter - The Asserter/Stringifier (for parents + toSource).
 * @param {object} node - The function node carrying the check.
 * @param {string} name - Bare type name from JSDoc.
 * @returns {string|undefined} Reference expression or undefined.
 */
function resolveTypeBinding(asserter, node, name) {
  if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name)) {
    return undefined;
  }
  const {parents} = asserter;
  const idx = parents.findLastIndex((_) => _ === node);
  if (idx === -1) {
    return undefined;
  }
  // Innermost scope first: walk from the check site outward.
  for (let i = idx; i >= 0; i--) {
    const scope = parents[i];
    if (!scope || typeof scope.type !== 'string') {
      continue;
    }
    // Block-level declarations: const/let/var/function/class in any block.
    const found = declarationIn(scope, name, asserter);
    if (found) {
      return found;
    }
    // import {X} / import X / import * as X at program top.
    if (scope.type === 'Program') {
      const imported = importIn(scope, name);
      if (imported) {
        return imported;
      }
    }
    // Function params shadow outer bindings but are values, never
    // constructor bindings: stop only if a param *is* the name? No —
    // params cannot be types, keep walking outward past them.
  }
  return undefined;
}
/**
 * Finds a declaration of `name` directly in `scope` (no recursion: the
 * caller walks outward level by level, so inner shadowing wins).
 * @param {object} scope - Babel block/program/function node.
 * @param {string} name - Binding name.
 * @param {object} asserter - For toSource (unused, kept for symmetry).
 * @returns {string|undefined} The name when declared, else undefined.
 */
function declarationIn(scope, name) {
  const body = Array.isArray(scope.body) ? scope.body : scope.body?.body;
  if (!Array.isArray(body)) {
    return undefined;
  }
  for (const stmt of body) {
    if (!stmt || typeof stmt.type !== 'string') {
      continue;
    }
    if (stmt.type === 'FunctionDeclaration' && stmt.id?.name === name) {
      return name;
    }
    if (stmt.type === 'ClassDeclaration' && stmt.id?.name === name) {
      return name;
    }
    if (stmt.type === 'VariableDeclaration') {
      for (const decl of stmt.declarations || []) {
        if (declares(decl.id, name)) {
          return name;
        }
      }
    }
  }
  return undefined;
}
/**
 * Whether a binding pattern declares `name` (Identifier, destructuring,
 * defaults, rest).
 * @param {object} pattern - Babel pattern node.
 * @param {string} name - Binding name.
 * @returns {boolean} True when declared.
 */
function declares(pattern, name) {
  if (!pattern) {
    return false;
  }
  switch (pattern.type) {
    case 'Identifier':
      return pattern.name === name;
    case 'ObjectPattern':
      return (pattern.properties || []).some((prop) => {
        if (prop.type === 'RestElement') {
          return declares(prop.argument, name);
        }
        return declares(prop.value, name);
      });
    case 'ArrayPattern':
      return (pattern.elements || []).some((el) => declares(el, name));
    case 'AssignmentPattern':
      return declares(pattern.left, name);
    case 'RestElement':
      return declares(pattern.argument, name);
    default:
      return false;
  }
}
/**
 * Finds an import binding `name` in a Program node.
 * @param {object} program - Babel Program node.
 * @param {string} name - Binding name.
 * @returns {string|undefined} The name when imported, else undefined.
 */
function importIn(program, name) {
  for (const stmt of program.body || []) {
    if (stmt?.type !== 'ImportDeclaration') {
      continue;
    }
    for (const spec of stmt.specifiers || []) {
      if (spec?.local?.name === name) {
        return name;
      }
    }
  }
  return undefined;
}
export {resolveTypeBinding};
