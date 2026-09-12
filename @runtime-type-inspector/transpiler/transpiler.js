#!/usr/bin/env node
import {addTypeChecks} from './index.mjs';
import {readFileSync} from 'fs';
const filename = process.argv[2];
if (!filename) {
  console.error('Usage: transpiler <filename>');
  process.exit(1);
}
console.log(addTypeChecks(readFileSync(filename, 'utf8')));