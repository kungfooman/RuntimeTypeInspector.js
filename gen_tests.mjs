import {readdirSync} from 'fs';
const dir = './test/typechecking/';
const files = readdirSync(dir);
const out = [];
for (const file of files) {
  const parts = file.split('-input.mjs');
  // console.log(file);
  if (parts.length == 2) {
    const input  = dir + file;
    const output = dir + parts[0] + '-output.mjs';
    out.push({input, output});
    // console.log("GOT TWO", ...parts);
  }
}
console.log(JSON.stringify(out, null, 2));
