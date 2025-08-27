import {readFileSync  } from 'fs';
import {join} from 'path';
import {parse         } from '@babel/parser';
import {parserOptions } from '../../src-transpiler/parserOptions.js';
import {JSDocAnnotator} from '../../src-transpiler/JSDocAnnotator.js';

import {dirname      } from 'node:path';
import {fileURLToPath} from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));

const examples = ['./example-1.js', './example-2.js', './example-3.js'];
let errors = 0;
for (const example of examples) {
  const filename = join(__dirname, example);
  const content = readFileSync(filename, 'utf8');
  const ast = parse(content, parserOptions);
  new JSDocAnnotator().annotate(ast);
  // console.log("ast", ast);
  const funcDecl = ast.program.body.find(_ => _.type === 'FunctionDeclaration');
  const out = JSON.stringify(funcDecl.paramTypes, function (name, val) {
    if (name === "loc" || name === "start" || name === "end") {
      return undefined; // remove
    }
    return val; // keep
  }, 2);
  const expected = ast.comments[ast.comments.length - 1].value.trim();
  const success = out === expected;
  if (!success) {
    console.log(`Test ${example} failed!`, {out, expected});
    errors++;
  }
}
process.exit(errors); // 0 means success
