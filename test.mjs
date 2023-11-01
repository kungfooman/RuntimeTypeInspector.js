import {addTypeChecks} from './src-transpiler/addTypeChecks.mjs';
import {readFileSync} from 'fs';
const content = readFileSync('./test/typechecking.json', 'utf8');
const tests = JSON.parse(content);
let discrepancies = 0;
for (const {input, output} of tests) {
    const inputContent = readFileSync(input, 'utf8');
    const outputContent = readFileSync(output, 'utf8');
    const newOutputContent = addTypeChecks(inputContent);
    if (newOutputContent !== outputContent) {
        discrepancies++;
        console.error("Discrepancy detected, please check!", {
            input,
            inputContent,
            output,
            outputContent,
            newOutputContent
        });
    }
    //console.log(input, output);
}
if (discrepancies) {
    console.error(`Found ${discrepancies} discrepancies in ${tests.length} tests`);
}
