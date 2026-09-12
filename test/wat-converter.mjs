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
)`,
  },
  {
    input: `function mod(a, b) {
  return a % b;
}`,
    output: `(module
  (func $mod (param $a f32) (param $b f32) (result f32)
    (block $exit (result f32)
      (return
        (f32.add
          (local.get $a)
          (f32.neg
            (f32.mul
              (f32.trunc
                (f32.div
                  (local.get $a)
                  (local.get $b)
                )
              )
              (local.get $b)
            )
          )
        )
      )
    )
  )
)`,
  },
  {
    input: `function m(a, b) {
  return Math.max(a, b) + Math.floor(b);
}`,
    output: `(module
  (func $m (param $a f32) (param $b f32) (result f32)
    (block $exit (result f32)
      (return
        (f32.add
          (f32.max
            (local.get $a)
            (local.get $b)
          )
          (f32.floor
            (local.get $b)
          )
        )
      )
    )
  )
)`,
  },
  {
    input: `function infnan() {
  return Infinity - NaN;
}`,
    output: `(module
  (func $infnan (result f32)
    (block $exit (result f32)
      (return
        (f32.sub
          (f32.const inf)
          (f32.const nan)
        )
      )
    )
  )
)`,
  },
  {
    input: `function sum(n) {
  let total = 0.0;
  let i = 0.0;
  while (i <= n) {
    total = total + i;
    i = i + 1;
  }
  return total;
}`,
    output: `(module
  (func $sum (param $n f32) (result f32)
    (local $total f32)
    (local $i f32)
    (block $exit (result f32)
      (local.set $total
        (f32.const 0)
      )
      (local.set $i
        (f32.const 0)
      )
      (block $exit0
        (loop $top0
          (f32.le
            (local.get $i)
            (local.get $n)
          )
          (i32.eqz)
          (br_if $exit0)
          (local.set $total
            (f32.add
              (local.get $total)
              (local.get $i)
            )
          )
          (local.set $i
            (f32.add
              (local.get $i)
              (f32.const 1)
            )
          )
          (br $top0)
        )
      )
      (return
        (local.get $total)
      )
    )
  )
)`,
  },
  {
    input: `function sum(n) {
  let total = 0.0;
  for (let i = 0; i <= n; i++) {
    total = total + i;
  }
  return total;
}`,
    output: `(module
  (func $sum (param $n f32) (result f32)
    (local $total f32)
    (local $i f32)
    (block $exit (result f32)
      (local.set $total
        (f32.const 0)
      )
      (local.set $i
        (f32.const 0)
      )
      (block $exit0
        (loop $top0
          (f32.le
            (local.get $i)
            (local.get $n)
          )
          (i32.eqz)
          (br_if $exit0)
          (local.set $total
            (f32.add
              (local.get $total)
              (local.get $i)
            )
          )
          (local.set $i
            (f32.add
              (local.get $i)
              (f32.const 1)
            )
          )
          (br $top0)
        )
      )
      (return
        (local.get $total)
      )
    )
  )
)`,
  },
  {
    input: `function count(n) {
  let total = 0.0;
  do {
    total = total + 1;
    n = n - 1;
  } while (n > 0);
  return total;
}`,
    output: `(module
  (func $count (param $n f32) (result f32)
    (local $total f32)
    (block $exit (result f32)
      (local.set $total
        (f32.const 0)
      )
      (block $exit0
        (loop $top0
          (local.set $total
            (f32.add
              (local.get $total)
              (f32.const 1)
            )
          )
          (local.set $n
            (f32.sub
              (local.get $n)
              (f32.const 1)
            )
          )
          (f32.gt
            (local.get $n)
            (f32.const 0)
          )
          (i32.eqz)
          (br_if $exit0)
          (br $top0)
        )
      )
      (return
        (local.get $total)
      )
    )
  )
)`,
  },
  {
    input: `function skip(n) {
  let total = 0.0;
  let i = 0.0;
  while (i <= n) {
    if (i == 3) {
      i = i + 1;
      continue;
    }
    total = total + i;
    if (total > 10) {
      break;
    }
    i = i + 1;
  }
  return total;
}`,
    output: `(module
  (func $skip (param $n f32) (result f32)
    (local $total f32)
    (local $i f32)
    (block $exit (result f32)
      (local.set $total
        (f32.const 0)
      )
      (local.set $i
        (f32.const 0)
      )
      (block $exit0
        (loop $top0
          (f32.le
            (local.get $i)
            (local.get $n)
          )
          (i32.eqz)
          (br_if $exit0)
          (if
            (f32.eq
              (local.get $i)
              (f32.const 3)
            )
            (then
              (local.set $i
                (f32.add
                  (local.get $i)
                  (f32.const 1)
                )
              )
              (br $top0)
            )
          )
          (local.set $total
            (f32.add
              (local.get $total)
              (local.get $i)
            )
          )
          (if
            (f32.gt
              (local.get $total)
              (f32.const 10)
            )
            (then
              (br $exit0)
            )
          )
          (local.set $i
            (f32.add
              (local.get $i)
              (f32.const 1)
            )
          )
          (br $top0)
        )
      )
      (return
        (local.get $total)
      )
    )
  )
)`,
  },
  {
    input: `function clim(a, b) {
  return a <= b ? a : b;
}`,
    output: `(module
  (func $clim (param $a f32) (param $b f32) (result f32)
    (block $exit (result f32)
      (return
        (if (result f32)
          (f32.le
            (local.get $a)
            (local.get $b)
          )
          (then
            (local.get $a)
          )
          (else
            (local.get $b)
          )
        )
      )
    )
  )
)`,
  },
  {
    input: `function logic(a, b) {
  if (a > 0 && b > 0) {
    return a + b;
  }
  return a || b;
}`,
    output: `(module
  (func $logic (param $a f32) (param $b f32) (result f32)
    (block $exit (result f32)
      (if
        (if (result i32)
          (f32.gt
            (local.get $a)
            (f32.const 0)
          )
          (then
            (f32.gt
              (local.get $b)
              (f32.const 0)
            )
          )
          (else
            (f32.gt
              (local.get $a)
              (f32.const 0)
            )
          )
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
        (if (result f32)
          (f32.ne
            (local.get $a)
            (f32.const 0)
          )
          (then
            (local.get $a)
          )
          (else
            (local.get $b)
          )
        )
      )
    )
  )
)`,
  },
  {
    input: `function not(a, b) {
  if (!(a > 0)) {
    return b;
  }
  return a;
}`,
    output: `(module
  (func $not (param $a f32) (param $b f32) (result f32)
    (block $exit (result f32)
      (if
        (i32.eqz
          (f32.gt
            (local.get $a)
            (f32.const 0)
          )
        )
        (then
          (return
            (local.get $b)
          )
        )
      )
      (return
        (local.get $a)
      )
    )
  )
)`,
  },
  {
    input: `/** @param {i32} n
 * @returns {i32}
 */
function bits(n) {
  return n % 2 + n / 2;
}`,
    output: `(module
  ;;* @param {i32} n
  ;; @returns {i32}
  (func $bits (param $n i32) (result i32)
    (block $exit (result i32)
      (return
        (i32.add
          (i32.rem_s
            (local.get $n)
            (i32.const 2)
          )
          (i32.div_s
            (local.get $n)
            (i32.const 2)
          )
        )
      )
    )
  )
)`,
  },
  {
    input: `/** @param {i64} n
 * @returns {i64}
 */
function big(n) {
  return n - 1;
}`,
    output: `(module
  ;;* @param {i64} n
  ;; @returns {i64}
  (func $big (param $n i64) (result i64)
    (block $exit (result i64)
      (return
        (i64.sub
          (local.get $n)
          (i64.const 1)
        )
      )
    )
  )
)`,
  },
  {
    input: `/** @param {f64} n
 * @returns {f64}
 */
function dbl(n) {
  return n * 0.5;
}`,
    output: `(module
  ;;* @param {f64} n
  ;; @returns {f64}
  (func $dbl (param $n f64) (result f64)
    (block $exit (result f64)
      (return
        (f64.mul
          (local.get $n)
          (f64.const 0.5)
        )
      )
    )
  )
)`,
  },
  {
    input: `function inc(a) {
  let x = a;
  x++;
  --x;
  return x;
}`,
    output: `(module
  (func $inc (param $a f32) (result f32)
    (local $x f32)
    (block $exit (result f32)
      (local.set $x
        (local.get $a)
      )
      (local.set $x
        (f32.add
          (local.get $x)
          (f32.const 1)
        )
      )
      (local.set $x
        (f32.sub
          (local.get $x)
          (f32.const 1)
        )
      )
      (return
        (local.get $x)
      )
    )
  )
)`,
  },
  {
    input: `const arr = [1.0, 2.0, 3.0, 4.0];
function sum(n) {
  let total = 0.0;
  let i = 0.0;
  while (i <= n) {
    total = total + arr[i];
    i = i + 1;
  }
  return total;
}`,
    output: `(module
  (func $sum (param $n f32) (result f32)
    (local $total f32)
    (local $i f32)
    (block $exit (result f32)
      (local.set $total
        (f32.const 0)
      )
      (local.set $i
        (f32.const 0)
      )
      (block $exit0
        (loop $top0
          (f32.le
            (local.get $i)
            (local.get $n)
          )
          (i32.eqz)
          (br_if $exit0)
          (local.set $total
            (f32.add
              (local.get $total)
              (f32.load
                (i32.add
                  (i32.const 0)
                  (i32.mul
                    (i32.trunc_f32_s
                      (local.get $i)
                    )
                    (i32.const 4)
                  )
                )
              )
            )
          )
          (local.set $i
            (f32.add
              (local.get $i)
              (f32.const 1)
            )
          )
          (br $top0)
        )
      )
      (return
        (local.get $total)
      )
    )
  )
  (memory (export "m") 1)
  (data (i32.const 0) "\\00\\00\\80\\3f\\00\\00\\00\\40\\00\\00\\40\\40\\00\\00\\80\\40")
)`,
  },
  {
    input: `const arr = [1.0, 2.0, 3.0, 4.0];
function set(i, v) {
  arr[i] = v;
  return arr[i];
}`,
    output: `(module
  (func $set (param $i f32) (param $v f32) (result f32)
    (block $exit (result f32)
      (f32.store
        (i32.add
          (i32.const 0)
          (i32.mul
            (i32.trunc_f32_s
              (local.get $i)
            )
            (i32.const 4)
          )
        )
        (local.get $v)
      )
      (return
        (f32.load
          (i32.add
            (i32.const 0)
            (i32.mul
              (i32.trunc_f32_s
                (local.get $i)
              )
              (i32.const 4)
            )
          )
        )
      )
    )
  )
  (memory (export "m") 1)
  (data (i32.const 0) "\\00\\00\\80\\3f\\00\\00\\00\\40\\00\\00\\40\\40\\00\\00\\80\\40")
)`,
  },
  {
    input: `const person = {x: 1.0, y: 2.0};
function sum() {
  return person.x + person.y;
}`,
    output: `(module
  (func $sum (result f32)
    (block $exit (result f32)
      (return
        (f32.add
          (f32.load
            (i32.add
              (i32.const 0)
              (i32.mul
                (i32.const 0)
                (i32.const 4)
              )
            )
          )
          (f32.load
            (i32.add
              (i32.const 0)
              (i32.mul
                (i32.const 1)
                (i32.const 4)
              )
            )
          )
        )
      )
    )
  )
  (memory (export "m") 1)
  (data (i32.const 0) "\\00\\00\\80\\3f\\00\\00\\00\\40")
)`,
  },
  {
    input: `const person = {x: 1.0, y: 2.0};
function setx(v) {
  person.x = v;
  return person.x;
}`,
    output: `(module
  (func $setx (param $v f32) (result f32)
    (block $exit (result f32)
      (f32.store
        (i32.add
          (i32.const 0)
          (i32.mul
            (i32.const 0)
            (i32.const 4)
          )
        )
        (local.get $v)
      )
      (return
        (f32.load
          (i32.add
            (i32.const 0)
            (i32.mul
              (i32.const 0)
              (i32.const 4)
            )
          )
        )
      )
    )
  )
  (memory (export "m") 1)
  (data (i32.const 0) "\\00\\00\\80\\3f\\00\\00\\00\\40")
)`,
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
  const ast = parse(input, {sourceType: 'module', attachComment: true});
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