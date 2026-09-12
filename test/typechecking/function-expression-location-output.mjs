
// 1. Multiple declarators in a single statement (let / const / object mixed)

/**
 * @param {number} a - First number.
 * @param {number} b - Second number.
 * @returns {number} Sum.
 */
let add = function (a, b) {
  if (!inspectType(a, "number", 'add', 'a')) {
    youCanAddABreakpointHere();
  }
  if (!inspectType(b, "number", 'add', 'b')) {
    youCanAddABreakpointHere();
  }
  return a + b;
}, sub = function (a, b) {
  if (!inspectType(a, "number", 'sub', 'a')) {
    youCanAddABreakpointHere();
  }
  if (!inspectType(b, "number", 'sub', 'b')) {
    youCanAddABreakpointHere();
  }
  return a - b;
}, obj = {
  mul: function (a, b) {
    if (!inspectType(a, "number", 'mul', 'a')) {
      youCanAddABreakpointHere();
    }
    if (!inspectType(b, "number", 'mul', 'b')) {
      youCanAddABreakpointHere();
    }
    return a * b;
  }
};
// 2. Nested function expression in a declarator inside another function expression


/**
 * @param {number} a - Number.
 * @returns {Function} A function.
 */

const outer = function (a) {
  if (!inspectType(a, "number", 'outer', 'a')) {
    youCanAddABreakpointHere();
  }
  
  /**
   * @param {number} b - Number.
   * @returns {number} Sum with outer.
   */
  const inner = function (b) {
    if (!inspectType(b, "number", 'inner', 'b')) {
      youCanAddABreakpointHere();
    }
    return a + b;
  };
  return inner;
};
// 3. Named function expression uses its own name, not the variable


/**
 * @param {number} x - Number.
 * @returns {number} Doubled.
 */

const named = function label(x) {
  if (!inspectType(x, "number", 'label', 'x')) {
    youCanAddABreakpointHere();
  }
  return x * 2;
};
// 4. Object property value reports the property name, not the object variable


/**
 * @param {number} y - Number.
 * @returns {number} Y plus one.
 */

const object = {
  method: function (y) {
    if (!inspectType(y, "number", 'method', 'y')) {
      youCanAddABreakpointHere();
    }
    return y + 1;
  }
};
// 5. Assignment to a previously declared variable

let assigned;

/**
 * @param {number} z - Number.
 * @returns {number} Z minus one.
 */

assigned = function (z) {
  if (!inspectType(z, "number", 'assigned', 'z')) {
    youCanAddABreakpointHere();
  }
  return z - 1;
};
// 6. Function passed as call argument has no name available


/**
 * @param {number[]} numbers - Numbers.
 * @returns {number[]} Squared numbers.
 */

function mapStuff(numbers) {
  if (!inspectType(numbers, {
    "type": "array",
    "elementType": "number",
    "optional": false
  }, 'mapStuff', 'numbers')) {
    youCanAddABreakpointHere();
  }
  return numbers.map(
  /**
   * @param {number} n - Number.
   * @returns {number} Squared.
   */ 
  function (n) {
    if (!inspectType(n, "number", 'unnamed function expression', 'n')) {
      youCanAddABreakpointHere();
    }
    return n * n;
  });
}
// 7. Shorthand object method syntax: { add(a, b) { ... } }

var x = {
  
  /**
   * @param {number} a - First number.
   * @param {number} b - Second number.
   * @returns {number} Sum.
   */
  add(a, b) {
    if (!inspectType(a, "number", 'add', 'a')) {
      youCanAddABreakpointHere();
    }
    if (!inspectType(b, "number", 'add', 'b')) {
      youCanAddABreakpointHere();
    }
    return a + b;
  }
};
