import {readdirSync, readFileSync, statSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import * as espree from 'espree';
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
    if ((node.type === 'CallExpression' || node.type === 'NewExpression' || node.type === 'OptionalCallExpression') &&
      node.arguments.length > 1 &&
      node.loc.start.line !== node.loc.end.line) {
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
function collectJsFiles(path, out) {
  const stat = statSync(path);
  if (stat.isFile()) {
    if (path.endsWith('.js')) {
      out.push(path);
    }
    return;
  }
  for (const entry of readdirSync(path)) {
    collectJsFiles(join(path, entry), out);
  }
}
function breakFile(file) {
  const code = readFileSync(file, 'utf8');
  const ast = espree.parse(code, {
    ecmaVersion: 2022,
    sourceType: 'module',
    loc: true,
    range: true,
    tokens: true,
  });
  const calls = [];
  collect(ast, calls);
  const {tokens} = ast;
  const edits = [];
  for (const node of calls) {
    const first = node.arguments[0];
    if (first.loc.start.line === node.callee.loc.end.line) {
      // Find the '(' that opens this call: first punctuator at or after
      // the end of the callee (skips the '?.' of an optional chain).
      const open = tokens.find((token) => token.type === 'Punctuator' &&
        token.value === '(' &&
        token.range[0] >= node.callee.range[1] &&
        token.range[1] <= first.range[0]);
      if (open !== undefined) {
        edits.push(open.range[1]);
      }
    }
    // Break between any two arguments sharing one line, after the comma.
    for (let index = 1; index < node.arguments.length; index += 1) {
      const prev = node.arguments[index - 1];
      const current = node.arguments[index];
      if (prev.loc.end.line === current.loc.start.line) {
        const comma = tokens.find((token) => token.type === 'Punctuator' &&
          token.value === ',' &&
          token.range[0] >= prev.range[1] &&
          token.range[1] <= current.range[0]);
        if (comma !== undefined) {
          edits.push(comma.range[1]);
        }
      }
    }
  }
  edits.sort((a, b) => b - a);
  let next = code;
  let prevPos = Infinity;
  for (const pos of edits) {
    // Edits are exclusive end offsets: insert the newline after pos - 1.
    // Skip duplicates from overlapping calls sharing one boundary.
    if (pos === prevPos) {
      continue;
    }
    prevPos = pos;
    next = next.slice(0, pos) + '\n' + next.slice(pos);
  }
  if (next !== code) {
    writeFileSync(file, next);
  }
  return edits.length;
}
const targets = process.argv.slice(2);
if (targets.length === 0) {
  console.error('usage: node break-hanging-calls.mjs <file-or-dir> [...]');
  process.exit(1);
}
const files = [];
for (const target of targets) {
  collectJsFiles(target, files);
}
let total = 0;
for (const file of files) {
  const count = breakFile(file);
  if (count > 0) {
    console.log(file + ': broke ' + count + ' hanging argument boundaries');
    total += count;
  }
}
console.log('files=' + files.length + ' total=' + total);
