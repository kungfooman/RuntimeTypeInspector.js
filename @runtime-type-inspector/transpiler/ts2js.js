#!/usr/bin/env node
import {ts2js} from './index.mjs';
import {readFileSync} from 'fs';
const filename = process.argv[2];
if (!filename) {
  console.error('Usage: ts2js <filename>');
  process.exit(1);
}
console.log(ts2js(readFileSync(filename, 'utf8')));