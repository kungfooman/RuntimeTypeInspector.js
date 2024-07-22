import {createTypeFromMapping} from './src-runtime/createTypeFromMapping.js';
import {expandType           } from './src-transpiler/expandType.js';
import {validateType         } from './src-runtime/validateType.js';
import {validateUnion        } from './src-runtime/validateUnion.js';
import {validateTuple        } from './src-runtime/validateTuple.js';
import {typedefs             } from './src-runtime/registerTypedef.js';
/**
 * @param {Object<string, any>} obj - The object to clear.
 */
function clearObject(obj) {
  Object.keys(obj).forEach(_ => delete obj[_]);
}
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
  () => validateUnion(1,         {type: 'union', optional: false, members: [1, 2, 3                  ]}, 'loc', 'name', true, warn, 0),
  () => validateUnion(true,      {type: 'union', optional: false, members: [false, true, 'null'      ]}, 'loc', 'name', true, warn, 0),
  () => validateUnion({},        {type: 'union', optional: false, members: ['object', 123            ]}, 'loc', 'name', true, warn, 0),
  () => validateUnion([],        {type: 'union', optional: false, members: ['array', 123             ]}, 'loc', 'name', true, warn, 0),
  () => validateUnion(true,      {type: 'union', optional: false, members: [false, 'null'            ]}, 'loc', 'name', true, warn, 0) === false,
  () => validateUnion(5,         {type: 'union', optional: false, members: [1, 2, 3                  ]}, 'loc', 'name', true, warn, 0) === false,
  () => validateUnion('"str"',   {type: 'union', optional: false, members: ['"foo"', '"bar"', '"baz"']}, 'loc', 'name', true, warn, 0) === false,
  () => validateTuple([1, 1, 1], expandType('[1, 1, 1]'   ), 'loc', 'name', true, warn, 0),
  () => validateTuple([1, 1, 1], expandType('[1, 1]'      ), 'loc', 'name', true, warn, 0) === false,
  () => validateTuple([1, 1, 1], expandType('[1, 1, 1, 1]'), 'loc', 'name', true, warn, 0) === false,
  () => {
    const str = '{[Key in 1|2|3]: {testkey: [Key, Key, Key], bla: Key}}';
    const mapping = expandType(str);
    const type = createTypeFromMapping(mapping, warn);
    const keys = Object.values(type.properties).map(_ => _.properties.bla);
    const ret = keys[0] === 1 && keys[1] === 2 && keys[2] === 3;
    return ret;
  },
  ...(await import('./src-runtime/createType.spec.js'         )).tests,
  ...(await import('./src-runtime/createTypeFromKeyof.spec.js')).tests,
  ...(await import('./src-runtime/resolveType.spec.js'        )).tests,
  //() => validateUnion(null,      {type: 'union', members: ['a', 2, null]       }, 'loc', 'name', true, warn),
  //() => validateUnion(undefined, {type: 'union', members: ['str', 1, false]    }, 'loc', 'name', true, warn) === false,
];
let errors = 0;
for (const test of tests) {
  clearObject(typedefs); // Each test starts with a clean slate of typedefs
  const ret = test();
  if (!ret) {
    console.error("Test failed: " + test);
    errors++;
  }
}
process.exit(errors); // 0 means success
