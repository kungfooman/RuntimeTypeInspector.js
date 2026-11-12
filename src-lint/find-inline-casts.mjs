import {readdirSync, readFileSync, statSync} from 'node:fs';
import {join} from 'node:path';
import * as espree from 'espree';
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
function findInlineCasts(file, code) {
  const ast = espree.parse(code, {
    ecmaVersion: 2022,
    sourceType: 'module',
    loc: true,
    range: true,
    comment: true,
    tokens: true,
  });
  const found = [];
  for (const comment of ast.comments) {
    if (comment.type !== 'Block' || !/@type\b/.test(comment.value)) {
      continue;
    }
    const next = ast.tokens.find((token) => token.range[0] >= comment.range[1]);
    if (next !== undefined && next.value === '(') {
      found.push(comment.loc.start.line);
    }
  }
  return found;
}
const targets = process.argv.slice(2);
const roots = targets.length > 0 ? targets : ['src-runtime', 'src-transpiler'];
const files = [];
for (const root of roots) {
  collectJsFiles(root, files);
}
let total = 0;
for (const file of files) {
  const code = readFileSync(file, 'utf8');
  const lines = findInlineCasts(file, code);
  for (const line of lines) {
    console.log(file + ':' + line + ': inline JSDoc cast; narrow the value instead (see JSDOC.md)');
    total += 1;
  }
}
if (total > 0) {
  console.log('inline-casts=' + total);
  process.exit(1);
}
console.log('no inline casts in ' + files.length + ' files');
