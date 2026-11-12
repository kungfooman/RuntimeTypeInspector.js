import {readdirSync, readFileSync, statSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import * as espree from 'espree';
import {isBareShorthand} from './isBareShorthand.mjs';
function collectJsFiles(path, out) {
  let stat;
  try {
    stat = statSync(path);
  } catch {
    return;
  }
  if (stat.isFile()) {
    if (path.endsWith('.js') || path.endsWith('.mjs')) {
      out.push(path);
    }
    return;
  }
  for (const entry of readdirSync(path)) {
    collectJsFiles(join(path, entry), out);
  }
}
const BLOCKED = new Set([
  'TaggedTemplateExpression',
  'ImportDeclaration',
]);
function subtreeBlocked(node) {
  const stack = [node];
  while (stack.length > 0) {
    const current = stack.pop();
    if (current === null || typeof current !== 'object') {
      continue;
    }
    if (Array.isArray(current)) {
      stack.push(...current);
      continue;
    }
    if (typeof current.type === 'string') {
      if (current !== node && BLOCKED.has(current.type)) {
        return true;
      }
      for (const key of Object.keys(current)) {
        if (key === 'parent') {
          continue;
        }
        stack.push(current[key]);
      }
    }
  }
  return false;
}
function collect(node, out) {
  if (node === null || typeof node !== 'object') {
    return;
  }
  if (Array.isArray(node)) {
    for (const child of node) {
      collect(child, out);
    }
    return;
  }
  if (typeof node.type === 'string') {
    if ((node.type === 'ObjectExpression' || node.type === 'ObjectPattern') &&
      node.loc.start.line === node.loc.end.line) {
      out.push(node);
    }
    for (const key of Object.keys(node)) {
      if (key === 'parent') {
        continue;
      }
      collect(node[key], out);
    }
  }
}
function partsOf(code, node) {
  return node.properties.map((prop) => code.slice(prop.range[0], prop.range[1]).trim());
}
function expandFile(file) {
  let code = readFileSync(file, 'utf8');
  let expanded = 0;
  for (;;) {
    const ast = espree.parse(code, {
      ecmaVersion: 2022,
      sourceType: 'module',
      loc: true,
      range: true,
      comment: true,
    });
    const candidates = [];
    collect(ast, candidates);
    // Outermost first so one pass expands the whole literal.
    candidates.sort((item, other) => {
      return (other.range[1] - other.range[0]) - (item.range[1] - item.range[0]);
    });
    let applied = false;
    for (const node of candidates) {
      if (node.loc.start.line !== node.loc.end.line || isBareShorthand(node)) {
        continue;
      }
      const hasComment = ast.comments.some((comment) => comment.range[0] >= node.range[0] &&
        comment.range[1] <= node.range[1]);
      if (hasComment || subtreeBlocked(node)) {
        continue;
      }
      let single = true;
      for (const prop of node.properties) {
        if (prop.loc.start.line !== prop.loc.end.line) {
          single = false;
          break;
        }
      }
      if (!single) {
        continue;
      }
      const baseIndent = ' '.repeat(node.loc.start.column);
      const innerIndent = baseIndent + '  ';
      const parts = partsOf(code, node);
      const lines = parts.map((part) => innerIndent + part);
      const onePerLine = '{\n' + lines.join(',\n') + '\n' + baseIndent + '}';
      code = code.slice(0, node.range[0]) + onePerLine + code.slice(node.range[1]);
      expanded += 1;
      applied = true;
      break;
    }
    if (!applied) {
      break;
    }
  }
  if (expanded > 0) {
    writeFileSync(file, code);
  }
  return expanded;
}
const args = process.argv.slice(2).filter((arg) => !arg.startsWith('-'));
const roots = args.length > 0 ? args : ['src-runtime', 'src-transpiler'];
const files = [];
for (const root of roots) {
  collectJsFiles(root, files);
}
let total = 0;
for (const file of files) {
  const count = expandFile(file);
  if (count > 0) {
    console.log(file + ': expanded ' + count + ' objects');
    total += count;
  }
}
console.log('files=' + files.length + ' total=' + total);
