import {readFileSync } from 'fs';
import {parse        } from '@babel/parser';
import {expandType   } from './src-transpiler/expandType.js';
import {Asserter     } from './src-transpiler/Asserter.js';
import {Stringifier  } from './src-transpiler/Stringifier.js';
import {parserOptions} from './src-transpiler/parserOptions.js';
/**
 * @typedef InputOutput
 * @property {string} input
 * @property {string} output
 */
/**
 * @param {string} a - Left source code.
 * @param {string} b - Right source code.
 */
function compareLineByLine(a, b) {
  const a_ = a.split('\n');
  const b_ = b.split('\n');
  const t = [];
  for (let i = 0; i < a_.length; i++) {
    const lineA = a_[i];
    const lineB = b_[i];
    if (lineA !== lineB) {
      t.push([
        `Line ${i}`,
        lineA,
        lineB,
      ]);
    }
  }
  //console.table(t);
  console.log(t);
}
const content = readFileSync('./test/typechecking.json', 'utf8');
/** @type {InputOutput[]} */
const tests = JSON.parse(content);
let discrepancies = 0;
/**
 * @param {string} input - Source code to normalize.
 * @returns {string} Normalized output.
 */
function normalize(input) {
  // Remove multiple newlines into one
  // I would rather not do it, but Stringifier needs a bit more love in other areas:
  //  - multiline array output when elements surpass a max-col option
  let output = input.replace(/\n+/g, '\n').trim();
  /** @todo Remove bunch of whitespaces from test outputs */
  output = output
    .split('\n')
    .filter(_ => _.trim().length)
    .map(_ => _.trim())
    .join('\n');
  return output;
}
for (const {input, output} of tests) {
  const inputContent  = readFileSync(input, 'utf8');
  const outputContent = readFileSync(output, 'utf8');
  const useStringifer = input.includes('stringifier-') || input.includes('jsx');
  const Converter = useStringifer ? Stringifier : Asserter;
  const converter = new Converter({
    expandType,
    addHeader: input.includes('jsx'),
    filename: 'repl.js'
  });
  const ast = parse(inputContent, parserOptions);
  // Must be called before getHeader since it's keeping an eye open for JSX elements.
  const source = converter.toSource(ast);
  const newOutputContent = converter.getHeader() + source;
  if (normalize(newOutputContent) !== normalize(outputContent)) {
    discrepancies++;
    console.error("Discrepancy detected, please check!", {
      input,
      //inputContent,
      output,
      //outputContent,
      //newOutputContent
    });
    compareLineByLine(outputContent, newOutputContent);
  }
  //console.log(input, output);
}
if (discrepancies) {
  console.error(`Found ${discrepancies} discrepancies in ${tests.length} tests`);
}
process.exit(discrepancies); // 0 means success
