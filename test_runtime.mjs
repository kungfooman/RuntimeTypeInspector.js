import {validateType} from './src-runtime/validateType.mjs';
// We expect all functions to return true.
const tests = [
  () => validateType({},                  {type: 'object', optional: false}, 'loc', 'name', true),
  // There is no type distinction between a "normal" and "prototype-less" object
  () => validateType(Object.create(null), {type: 'object', optional: false}, 'loc', 'name', true),
  // Every function is also an object
  () => validateType(Math.sqrt,           {type: 'object', optional: false}, 'loc', 'name', true),
  () => validateType(new Date(),          {type: 'object', optional: false}, 'loc', 'name', true),
  () => validateType(1,                   {type: 'object', optional: false}, 'loc', 'name', true) === false,
  () => validateType('nope',              {type: 'object', optional: false}, 'loc', 'name', true) === false,
  () => validateType(Symbol('nope'),      {type: 'object', optional: false}, 'loc', 'name', true) === false,
];
let errors = 0;
for (const test of tests) {
  const ret = test();
  if (!ret) {
    console.error("Test failed: " + test);
    errors++;
  }
}
process.exit(errors); // 0 means success
