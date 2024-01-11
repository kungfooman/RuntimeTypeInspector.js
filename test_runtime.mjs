import {expandType} from './src-transpiler/expandType.mjs';
import {validateType} from './src-runtime/validateType.mjs';
import {validateUnion} from './src-runtime/validateUnion.mjs';
import {validateTuple} from './src-runtime/validateTuple.mjs';
const warn = () => undefined;
// We expect all functions to return true.
const tests = [
  () => validateType({},                  {type: 'object', optional: false}, 'loc', 'name', true, warn, 0),
  // There is no type distinction between a "normal" and "prototype-less" object
  () => validateType(Object.create(null), {type: 'object', optional: false}, 'loc', 'name', true, warn, 0),
  // Every function is also an object
  () => validateType(Math.sqrt,           {type: 'object', optional: false}, 'loc', 'name', true, warn, 0),
  () => validateType(new Date(),          {type: 'object', optional: false}, 'loc', 'name', true, warn, 0),
  () => validateType(1,                   {type: 'object', optional: false}, 'loc', 'name', true, warn, 0) === false,
  () => validateType('nope',              {type: 'object', optional: false}, 'loc', 'name', true, warn, 0) === false,
  () => validateType(Symbol('nope'),      {type: 'object', optional: false}, 'loc', 'name', true, warn, 0) === false,
  () => validateUnion(1,         {type: 'union', members: [1, 2, 3                  ]}, 'loc', 'name', true, warn, 0),
  () => validateUnion(true,      {type: 'union', members: [false, true, 'null'      ]}, 'loc', 'name', true, warn, 0),
  () => validateUnion({},        {type: 'union', members: ['object', 123            ]}, 'loc', 'name', true, warn, 0),
  () => validateUnion([],        {type: 'union', members: ['array', 123             ]}, 'loc', 'name', true, warn, 0),
  () => validateUnion(true,      {type: 'union', members: [false, 'null'            ]}, 'loc', 'name', true, warn, 0) === false,
  () => validateUnion(5,         {type: 'union', members: [1, 2, 3                  ]}, 'loc', 'name', true, warn, 0) === false,
  () => validateUnion('"str"',   {type: 'union', members: ['"foo"', '"bar"', '"baz"']}, 'loc', 'name', true, warn, 0) === false,
  () => validateTuple([1, 1, 1], expandType('[1, 1, 1]'   ), 'loc', 'name', true, warn, 0),
  () => validateTuple([1, 1, 1], expandType('[1, 1]'      ), 'loc', 'name', true, warn, 0) === false,
  () => validateTuple([1, 1, 1], expandType('[1, 1, 1, 1]'), 'loc', 'name', true, warn, 0) === false,
  //() => validateUnion(null,      {type: 'union', members: ['a', 2, null]       }, 'loc', 'name', true, warn),
  //() => validateUnion(undefined, {type: 'union', members: ['str', 1, false]    }, 'loc', 'name', true, warn) === false,
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
