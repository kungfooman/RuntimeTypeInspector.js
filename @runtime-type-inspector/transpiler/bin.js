#!/usr/bin/env node
import {addTypeChecks} from './index.mjs';
import {readFileSync} from "fs";
const filename = process.argv[2];
if (!filename) {
  console.error('Please specify a filename as 2nd argument');
  process.exit(1);
}
const content = readFileSync(filename, 'utf8');
const contentTypeChecked = addTypeChecks(content);
console.log(contentTypeChecked);
