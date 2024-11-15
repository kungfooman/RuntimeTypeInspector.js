import {readFileSync, writeFileSync} from 'fs';
import {addTypeChecks} from "./src-transpiler/addTypeChecks.js";
const files = [
  "test-typeof.js",
];
for (const file of files) {
  const content = readFileSync('./test/convert-first/' + file, 'utf-8');
  const contentWithTypeChecks = addTypeChecks(content);
  writeFileSync('./test/converted/' + file, contentWithTypeChecks);
}
