import {addTypeChecks} from './src-transpiler/addTypeChecks.mjs';
import {expandType} from './src-transpiler/expandType.mjs';
import {readFileSync} from 'fs';
/**
 * @param {string} a 
 * @param {string} b 
 */
function compareLineByLine(a, b) {
  const a_ = a.split('\n');
  const b_ = b.split('\n');
  const t = [];
  for (let i=0; i<a_.length; i++) {
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
const tests = JSON.parse(content);
let discrepancies = 0;
for (const {input, output} of tests) {
  const inputContent = readFileSync(input, 'utf8');
  const outputContent = readFileSync(output, 'utf8');
  let newOutputContent = addTypeChecks(inputContent, {expandType});
  // Remove multiple newlines into one
  // I would rather not do it, but Stringifier needs a bit more love in other areas:
  //  - multiline array output when elements surpass a max-col option
  newOutputContent = newOutputContent.replace(/\n+/g, '\n').trim();
  if (newOutputContent !== outputContent.trim()) {
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
