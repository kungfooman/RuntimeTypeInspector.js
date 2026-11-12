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
// A line the aligner owns: single line, exactly one named specifier.
function alignable(node, tokens) {
  if (node.type !== 'ImportDeclaration' || node.loc.start.line !== node.loc.end.line) {
    return null;
  }
  if (node.specifiers.length !== 1 || node.specifiers[0].type !== 'ImportSpecifier') {
    return null;
  }
  const open = tokens.find((token) => token.type === 'Punctuator' && token.value === '{' &&
    token.range[0] >= node.range[0] && token.range[1] <= node.range[1]);
  const close = tokens.find((token) => token.type === 'Punctuator' && token.value === '}' &&
    token.range[0] >= node.range[0] && token.range[1] <= node.range[1]);
  if (open === undefined || close === undefined) {
    return null;
  }
  return {node, open, close};
}
function alignFile(file) {
  const code = readFileSync(file, 'utf8');
  const ast = espree.parse(code, {
    ecmaVersion: 2022,
    sourceType: 'module',
    loc: true,
    range: true,
    tokens: true,
  });
  const owned = [];
  for (const node of ast.body) {
    const entry = alignable(node, ast.tokens);
    if (entry !== null) {
      owned.push(entry);
    }
  }
  // Consecutive import lines form one alignment run.
  const runs = [];
  for (const entry of owned) {
    const prev = runs.length > 0 ? runs[runs.length - 1] : null;
    const follows = prev !== null &&
      entry.node.loc.start.line === prev[prev.length - 1].node.loc.end.line + 1;
    if (follows) {
      prev.push(entry);
    } else {
      runs.push([entry]);
    }
  }
  const edits = [];
  for (const run of runs) {
    const inners = run.map((entry) => code.slice(entry.open.range[1], entry.close.range[0]).trim());
    const width = Math.max(...inners.map((inner) => inner.length));
    for (let index = 0; index < run.length; index += 1) {
      const entry = run[index];
      const padded = inners[index] + ' '.repeat(width - inners[index].length);
      const replacement = code.slice(entry.node.range[0], entry.open.range[1]) +
        padded + code.slice(entry.close.range[0], entry.node.range[1]);
      const original = code.slice(entry.node.range[0], entry.node.range[1]);
      if (replacement !== original) {
        edits.push({start: entry.node.range[0], end: entry.node.range[1], replacement});
      }
    }
  }
  if (edits.length === 0) {
    return 0;
  }
  edits.sort((a, b) => b.start - a.start);
  let next = code;
  for (const edit of edits) {
    next = next.slice(0, edit.start) + edit.replacement + next.slice(edit.end);
  }
  writeFileSync(file, next);
  return edits.length;
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
    if (node.type === 'ObjectExpression' || node.type === 'ObjectPattern') {
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
// The core rule cannot scope by AST node, so this gate owns the split:
// ImportDeclaration lines carry run padding, and single-line objects
// must be bare shorthand (see isBareShorthand.mjs).
function checkBraces(file, code, ast) {
  const problems = [];
  const bracePairs = new Map();
  const stack = [];
  for (const token of ast.tokens) {
    if (token.type !== 'Punctuator') {
      continue;
    }
    if (token.value === '{') {
      stack.push(token);
    } else if (token.value === '}' && stack.length > 0) {
      const open = stack.pop();
      bracePairs.set(open.range[0], {open, close: token});
    }
  }
  const nodes = [];
  collect(ast, nodes);
  for (const node of nodes) {
    const pair = bracePairs.get(node.range[0]);
    if (pair === undefined) {
      continue;
    }
    if (pair.open.loc.start.line !== pair.close.loc.end.line) {
      continue;
    }
    if (isBareShorthand(node)) {
      continue;
    }
    const name = node.type === 'ObjectPattern' ? 'destructuring' : 'object';
    problems.push(file + ':' + pair.open.loc.start.line + ': single-line ' + name + ' must be bare shorthand like {a, b, c}');
  }
  return problems;
}
const args = process.argv.slice(2).filter((arg) => !arg.startsWith('-'));
const checkOnly = process.argv.includes('--check');
const roots = args.length > 0 ? args : ['src-runtime', 'src-transpiler'];
const files = [];
for (const root of roots) {
  collectJsFiles(root, files);
}
// Expected padding for one alignment run, keyed by import start offset.
function expectedRuns(code, owned) {
  const runs = [];
  for (const entry of owned) {
    const prev = runs.length > 0 ? runs[runs.length - 1] : null;
    const follows = prev !== null &&
      entry.node.loc.start.line === prev[prev.length - 1].node.loc.end.line + 1;
    if (follows) {
      prev.push(entry);
    } else {
      runs.push([entry]);
    }
  }
  const expected = new Map();
  for (const run of runs) {
    const inners = run.map((entry) => code.slice(entry.open.range[1], entry.close.range[0]).trim());
    const width = Math.max(...inners.map((inner) => inner.length));
    for (let index = 0; index < run.length; index += 1) {
      expected.set(run[index].node.range[0], inners[index] + ' '.repeat(width - inners[index].length));
    }
  }
  return expected;
}
let total = 0;
let problems = 0;
for (const file of files) {
  const code = readFileSync(file, 'utf8');
  const ast = espree.parse(code, {
    ecmaVersion: 2022,
    sourceType: 'module',
    loc: true,
    range: true,
    tokens: true,
  });
  for (const problem of checkBraces(file, code, ast)) {
    console.log(problem + ' (object-curly-spacing)');
    problems += 1;
  }
  const owned = [];
  for (const node of ast.body) {
    const entry = alignable(node, ast.tokens);
    if (entry !== null) {
      owned.push(entry);
    }
  }
  const expected = expectedRuns(code, owned);
  let misaligned = 0;
  for (const entry of owned) {
    const inner = code.slice(entry.open.range[1], entry.close.range[0]);
    if (inner !== expected.get(entry.node.range[0])) {
      if (checkOnly) {
        console.log(file + ':' + entry.node.loc.start.line + ': import not run-aligned');
        misaligned += 1;
      }
    }
  }
  problems += misaligned;
  if (checkOnly) {
    continue;
  }
  const count = alignFile(file);
  if (count > 0) {
    console.log(file + ': aligned ' + count + ' imports');
    total += count;
  }
}
if (checkOnly) {
  console.log('files=' + files.length + ' problems=' + problems);
  if (problems > 0) {
    process.exit(1);
  }
} else {
  console.log('files=' + files.length + ' total=' + total);
}
