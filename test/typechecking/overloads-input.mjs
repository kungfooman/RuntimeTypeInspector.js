/** Constructor overloads validate whole calls, not independent argument unions. */
class Vec4 {
  /**
   * @overload
   * @param {number} [x]
   * @param {number} [y]
   * @param {number} [z]
   * @param {number} [w]
   */
  /**
   * @overload
   * @param {number[]} values
   */
  /**
   * @param {number|number[]} [x]
   * @param {number} [y]
   * @param {number} [z]
   * @param {number} [w]
   */
  constructor(x, y, z, w) {
    this.x = Array.isArray(x) ? x[0] : x;
    this.y = y;
    this.z = z;
    this.w = w;
  }
}
new Vec4(); // ok
new Vec4(1, 2, 3, 4); // ok
new Vec4([1, 2, 3, 4]); // ok
new Vec4(1, 2); // ok
new Vec4(undefined); // ok
// @ts-expect-error Optional numbers do not accept null under strict null checks.
new Vec4(null); // warns
// @ts-expect-error No overload combines an array and extra arguments.
new Vec4([1, 2, 3, 4], 1, 2, 3); // warns
// @ts-expect-error Strings are not accepted.
new Vec4('nope'); // warns

/**
 * @overload
 * @param {string} text
 * @returns {string}
 */
/**
 * @overload
 * @param {number} left
 * @param {number} right
 * @returns {number}
 */
/**
 * @param {string|number} value
 * @param {number} [other]
 * @returns {string|number}
 */
export function choose(value, other) {
  return typeof value === 'number' ? value + (other || 0) : value;
}
choose('yes'); // ok
choose(1, 2); // ok
// @ts-expect-error A single number matches neither signature.
choose(1); // warns
// @ts-expect-error The second argument must be a number.
choose(1, 'bad'); // warns

/**
 * @overload
 * @param {string} text
 * @returns {string}
 * @overload
 * @param {number} value
 * @returns {number}
 * @param {string|number} value
 * @returns {string|number}
 */
const identity = (value) => value;
identity('x'); // ok
identity(1); // ok
// @ts-expect-error Booleans are not accepted.
identity(true); // warns

/**
 * @overload
 * @param {string} label
 * @param {...number[]} values
 * @returns {number}
 */
/**
 * @overload
 * @param {number} value
 * @returns {number}
 */
/**
 * @param {string|number} label
 * @param {...number} values
 * @returns {number}
 */
function sum(label, ...values) {
  return typeof label === 'number' ? label : values.length;
}
sum('x'); // ok
sum('x', 1, 2); // ok
sum(1); // ok
// @ts-expect-error The rest values must be numbers.
sum('x', 1, 'bad'); // warns
// @ts-expect-error The number overload has one argument.
sum(1, 2); // warns

/**
 * @template {string} T
 * @overload
 * @param {T} first
 * @param {NoInfer<T>} second
 * @returns {T}
 */
/**
 * @template {number} U
 * @overload
 * @param {U} first
 * @param {U} second
 * @returns {U}
 */
/**
 * @param {string|number} first
 * @param {string|number} second
 * @returns {string|number}
 */
function pair(first, second) {
  return second;
}
pair('a', 'a'); // ok
pair(1, 2); // ok: the failed string trial must not pin the number trial
// @ts-expect-error NoInfer retains the first string literal.
pair('a', 'b'); // warns
// @ts-expect-error Neither signature accepts mixed types.
pair('a', 1); // warns

/**
 * @overload
 * @param {number} n
 * @returns {number}
 */
/**
 * @overload
 * @param {string|null} s
 * @returns {string|null}
 */
/**
 * @param {number|string|null} value
 * @returns {number|string|null}
 */
const expression = function(value) { return value; };
expression(null); // ok
expression(3); // ok
// @ts-expect-error Neither overload accepts an object.
expression({}); // warns

/** @overload @param {number} value */
/** @overload @param {string} text */
class Box {
  /** @param {number|string} value */
  constructor(value) { this.value = value; }

  /**
   * @overload
   * @param {number} value
   * @returns {number}
   */
  /**
   * @overload
   * @param {string} value
   * @returns {string}
   */
  /** @param {number|string} value */
  static read(value) { return value; }
}
new Box(1); // ok
new Box('ok'); // ok
// @ts-expect-error The class constructor accepts strings or numbers.
new Box(false); // warns
Box.read(1); // ok
// @ts-expect-error The static method accepts strings or numbers.
Box.read(false); // warns

const operations = {
  /**
   * @overload
   * @param {number} value
   * @returns {number}
   */
  /**
   * @overload
   * @param {string} value
   * @returns {string}
   */
  /** @param {number|string} value */
  read(value) { return value; }
};
operations.read('ok'); // ok
// @ts-expect-error The object method accepts strings or numbers.
operations.read(false); // warns

/** @typedef {{value: number, next?: Chain}} Chain */
/**
 * @overload
 * @param {Chain} chain
 * @returns {number}
 */
/**
 * @overload
 * @param {string} label
 * @returns {number}
 */
/**
 * @param {Chain|string} value
 * @returns {number}
 */
function chainSize(value) {
  return typeof value === 'string' ? value.length : value.value;
}
chainSize({value: 1, next: {value: 2}}); // ok
chainSize('ok'); // ok
// @ts-expect-error Nested chain values must be numbers.
chainSize({value: 1, next: {value: 'bad'}}); // warns

/**
 * @overload
 * @param {string} text
 * @returns {string}
 * @param {string|number} value
 * @returns {string|number}
 */
function onlyText(value) { return value; }
onlyText('ok'); // ok
// @ts-expect-error The implementation tail is not an overload.
onlyText(1); // warns

/** @overload @param {string} value @returns {string} */
/** @param {string|number} value */
function format(value) {
  return String(value);
}
format('hello'); // ok
// @ts-expect-error The implementation accepts numbers, but its overload does not.
format(42); // warns

const computedName = 'execute';
let computedKeyReads = 0;
const computedHolder = {
  /**
   * @overload
   * @param {number} value
   * @returns {number}
   */
  /** @param {number|string} value */
  [((computedKeyReads++, computedName))]: (value) => typeof value === 'number' ? value : 0
};
computedHolder.execute(1); // ok
// @ts-expect-error The overload accepts numbers only.
computedHolder.execute('bad'); // warns
if (computedKeyReads !== 1 || computedHolder.execute.length !== 1 || computedHolder.execute.name !== 'execute') {
  throw new Error('Incorrect computed overload metadata');
}
