import {readdirSync, readFileSync, statSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import * as espree from 'espree';

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
    if (node.type === 'ReturnStatement' && node.argument !== null) {
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

// Splits a same-operator chain: `a && b && c` becomes [a, b, c].
function splitChain(argument, operator) {
  const parts = [];
  const walk = (node) => {
    if (node.type === 'LogicalExpression' && node.operator === operator) {
      walk(node.left);
      walk(node.right);
      return;
    }
    parts.push(node);
  };
  walk(argument);
  return parts;
}

// Only top-level `&&` (or top-level `||`) chains; mixed nesting is skipped.
function chainOf(argument) {
  if (argument.type !== 'LogicalExpression') {
    return null;
  }
  const operator = argument.operator;
  if (operator !== '&&' && operator !== '||') {
    return null;
  }
  const parts = splitChain(argument, operator);
  if (parts.length < 3) {
    return null;
  }
  for (const part of parts) {
    if (part.type === 'LogicalExpression') {
      return null;
    }
  }
  return {operator, parts};
}

function expandFile(file) {
  const code = readFileSync(file, 'utf8');
  const ast = espree.parse(code, {
    ecmaVersion: 2022,
    sourceType: 'module',
    loc: true,
    range: true,
  });
  const statements = [];
  collect(ast, statements);
  const hits = [];
  for (const node of statements) {
    const chain = chainOf(node.argument);
    if (chain === null) {
      continue;
    }
    // Espree strips grouping parens, so an already wrapped return looks
    // like `return (` with the argument starting after the paren.
    const head = code.slice(node.range[0], node.argument.range[0]);
    if (head.includes('(')) {
      continue;
    }
    hits.push({node, chain});
  }
  if (hits.length === 0) {
    return 0;
  }
  // Inside out: deepest return first so outer ranges stay valid.
  hits.sort((a, b) => b.node.range[0] - a.node.range[0]);
  let next = code;
  for (const {node, chain} of hits) {
    const baseIndent = ' '.repeat(node.loc.start.column);
    const innerIndent = baseIndent + '  ';
    const slices = chain.parts.map((part) => code.slice(part.range[0], part.range[1]).trim());
    const replacement = '(\n' +
      slices.map((slice, index) => {
        const tail = index < slices.length - 1 ? ' ' + chain.operator : '';
        return innerIndent + slice + tail;
      }).join('\n') + '\n' + baseIndent + ')';
    next = next.slice(0, node.argument.range[0]) + replacement + next.slice(node.argument.range[1]);
  }
  writeFileSync(file, next);
  return hits.length;
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
    console.log(file + ': expanded ' + count + ' returns');
    total += count;
  }
}
console.log('files=' + files.length + ' total=' + total);
