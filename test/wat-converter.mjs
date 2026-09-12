import {parse} from '@babel/parser';
import {WATConverter} from '../src-transpiler/WATConverter.js';
/**
 * @typedef {Object} WATTestCase
 * @property {string} input - JavaScript source code.
 * @property {string} output - Expected WAT output.
 */
/** @type {WATTestCase[]} */
const tests = [
  {
    input: `export function fib(n) {
  if (n <= 1) {
    return n;
  }
  return fib(n - 1) + fib(n - 2);
}`,
    output: `(module
  (func $fib (param $n f32) (result f32)
    (block $exit (result f32)
      (if
        (f32.le
          (local.get $n)
          (f32.const 1)
        )
        (then
          (return
            (local.get $n)
          )
        )
      )
      (return
        (f32.add
          (call $fib
            (f32.sub
              (local.get $n)
              (f32.const 1)
            )
          )
          (call $fib
            (f32.sub
              (local.get $n)
              (f32.const 2)
            )
          )
        )
      )
    )
  )
  (export "fib" (func $fib))
)`,
  },
  {
    input: `function loop(n) {
  let result = 0.0;
  if (n == 0) {
    result = 0.0;
  } else {
    result = n + loop(n - 1);
  }
  return result;
}`,
    output: `(module
  (func $loop (param $n f32) (result f32)
    (local $result f32)
    (block $exit (result f32)
      (local.set $result
        (f32.const 0)
      )
      (if
        (f32.eq
          (local.get $n)
          (f32.const 0)
        )
        (then
          (local.set $result
            (f32.const 0)
          )
        )
        (else
          (local.set $result
            (f32.add
              (local.get $n)
              (call $loop
                (f32.sub
                  (local.get $n)
                  (f32.const 1)
                )
              )
            )
          )
        )
      )
      (return
        (local.get $result)
      )
    )
  )
)`,
  },
  {
    input: `function ops(a, b) {
  if (a < b) {
    return a;
  }
  if (a > b) {
    return b;
  }
  if (a >= b) {
    return a + b;
  }
  return -a;
}`,
    output: `(module
  (func $ops (param $a f32) (param $b f32) (result f32)
    (block $exit (result f32)
      (if
        (f32.lt
          (local.get $a)
          (local.get $b)
        )
        (then
          (return
            (local.get $a)
          )
        )
      )
      (if
        (f32.gt
          (local.get $a)
          (local.get $b)
        )
        (then
          (return
            (local.get $b)
          )
        )
      )
      (if
        (f32.ge
          (local.get $a)
          (local.get $b)
        )
        (then
          (return
            (f32.add
              (local.get $a)
              (local.get $b)
            )
          )
        )
      )
      (return
        (f32.neg
          (local.get $a)
        )
      )
    )
  )
)
`,
  },
];
/**
 * @param {string} a - Expected output.
 * @param {string} b - Actual output.
 * @returns {string[][]} Lines that differ.
 */
function compareLineByLine(a, b) {
  const a_ = a.split('\n');
  const b_ = b.split('\n');
  const t = [];
  for (let i = 0; i < a_.length; i++) {
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
  return t;
}
/**
 * @param {string} input - Source code to normalize.
 * @returns {string} Normalized output.
 */
function normalize(input) {
  let output = input.replace(/\n+/g, '\n').trim();
  output = output
    .split('\n')
    .filter(_ => _.trim().length)
    .map(_ => _.trim())
    .join('\n');
  return output;
}
let discrepancies = 0;
for (const {input, output} of tests) {
  const ast = parse(input, {sourceType: 'module'});
  const actual = new WATConverter().toSource(ast);
  if (normalize(actual) !== normalize(output)) {
    discrepancies++;
    console.error('Discrepancy detected in WATConverter test:', {input});
    console.table(compareLineByLine(normalize(output), normalize(actual)));
  }
}
if (discrepancies) {
  console.error(`Found ${discrepancies} discrepancies in ${tests.length} WATConverter tests`);
} else {
  console.log(`ALL ${tests.length} WATConverter tests passed.`);
}
process.exit(discrepancies);