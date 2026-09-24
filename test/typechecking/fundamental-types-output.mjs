
// -----------------------------------------------------------------------------

// Top and bottom types: unknown accepts everything, never accepts nothing

// -----------------------------------------------------------------------------

/**
 * @param {unknown} a
 */
function takeUnknown(a) {
  if (!inspectType(a, "unknown", 'takeUnknown', 'a')) {
    youCanAddABreakpointHere();
  }
}

/**
 * @param {never} a
 */

function takeNever(a) {
  if (!inspectType(a, "never", 'takeNever', 'a')) {
    youCanAddABreakpointHere();
  }
}

/**
 * @param {void} a
 */

function takeVoid(a) {
  if (!inspectType(a, "void", 'takeVoid', 'a')) {
    youCanAddABreakpointHere();
  }
}

/**
 * @param {symbol} a
 */

function takeSymbol(a) {
  if (!inspectType(a, "symbol", 'takeSymbol', 'a')) {
    youCanAddABreakpointHere();
  }
}

/**
 * @param {bigint} a
 */

function takeBigint(a) {
  if (!inspectType(a, {
    "type": "bigint",
    "optional": false
  }, 'takeBigint', 'a')) {
    youCanAddABreakpointHere();
  }
}
// -----------------------------------------------------------------------------

// Intrinsic string mappings: Uppercase, Lowercase, Capitalize, Uncapitalize

// -----------------------------------------------------------------------------


/**
 * @param {Uppercase<string>} a
 */


// -----------------------------------------------------------------------------

// Intrinsic string mappings: Uppercase, Lowercase, Capitalize, Uncapitalize

// -----------------------------------------------------------------------------
function takeUpper(a) {
  if (!inspectType(a, {
    "type": "reference",
    "name": "Uppercase",
    "args": [
      "string"
    ],
    "optional": false
  }, 'takeUpper', 'a')) {
    youCanAddABreakpointHere();
  }
}

/**
 * @param {Uppercase<"abc">} a
 */

function takeUpperAbc(a) {
  if (!inspectType(a, {
    "type": "reference",
    "name": "Uppercase",
    "args": [
      "\"abc\""
    ],
    "optional": false
  }, 'takeUpperAbc', 'a')) {
    youCanAddABreakpointHere();
  }
}

/**
 * @param {Lowercase<string>} a
 */

function takeLower(a) {
  if (!inspectType(a, {
    "type": "reference",
    "name": "Lowercase",
    "args": [
      "string"
    ],
    "optional": false
  }, 'takeLower', 'a')) {
    youCanAddABreakpointHere();
  }
}

/**
 * @param {Capitalize<"foo">} a
 */

function takeCapitalized(a) {
  if (!inspectType(a, {
    "type": "reference",
    "name": "Capitalize",
    "args": [
      "\"foo\""
    ],
    "optional": false
  }, 'takeCapitalized', 'a')) {
    youCanAddABreakpointHere();
  }
}

/**
 * @param {Uncapitalize<"Foo">} a
 */

function takeUncapitalized(a) {
  if (!inspectType(a, {
    "type": "reference",
    "name": "Uncapitalize",
    "args": [
      "\"Foo\""
    ],
    "optional": false
  }, 'takeUncapitalized', 'a')) {
    youCanAddABreakpointHere();
  }
}
// -----------------------------------------------------------------------------

// Object and union utilities: Required, Exclude, Awaited, NoInfer

// -----------------------------------------------------------------------------


/**
 * @param {Required<{a?: number}>} opts
 */


// -----------------------------------------------------------------------------

// Object and union utilities: Required, Exclude, Awaited, NoInfer

// -----------------------------------------------------------------------------
function takeRequired(opts) {
  if (!inspectType(opts, {
    "type": "reference",
    "name": "Required",
    "args": [
      {
        "type": "object",
        "properties": {
          "a": {
            "type": "number",
            "optional": true
          }
        }
      }
    ],
    "optional": false
  }, 'takeRequired', 'opts')) {
    youCanAddABreakpointHere();
  }
}

/**
 * @param {Exclude<"a" | "b" | 1, string>} a
 */

function takeExcluded(a) {
  if (!inspectType(a, {
    "type": "reference",
    "name": "Exclude",
    "args": [
      {
        "type": "union",
        "members": [
          "\"a\"",
          "\"b\"",
          1
        ]
      },
      "string"
    ],
    "optional": false
  }, 'takeExcluded', 'a')) {
    youCanAddABreakpointHere();
  }
}

/**
 * @param {Awaited<Promise<number>>} a
 */

function takeAwaited(a) {
  if (!inspectType(a, {
    "type": "reference",
    "name": "Awaited",
    "args": [
      {
        "type": "promise",
        "elementType": "number"
      }
    ],
    "optional": false
  }, 'takeAwaited', 'a')) {
    youCanAddABreakpointHere();
  }
}

/**
 * @param {NoInfer<number>} a
 */

function takeNoInfer(a) {
  if (!inspectType(a, {
    "type": "reference",
    "name": "NoInfer",
    "args": [
      "number"
    ],
    "optional": false
  }, 'takeNoInfer', 'a')) {
    youCanAddABreakpointHere();
  }
}
// -----------------------------------------------------------------------------

// Already working: interfaces, builtins, functions

// -----------------------------------------------------------------------------


/**
 * @param {String} a
 */


// -----------------------------------------------------------------------------

// Already working: interfaces, builtins, functions

// -----------------------------------------------------------------------------
function takeStringObject(a) {
  if (!inspectType(a, "String", 'takeStringObject', 'a')) {
    youCanAddABreakpointHere();
  }
}

/**
 * @param {Date} a
 */

function takeDate(a) {
  if (!inspectType(a, "Date", 'takeDate', 'a')) {
    youCanAddABreakpointHere();
  }
}

/**
 * @param {CallableFunction} a
 */

function takeCallable(a) {
  if (!inspectType(a, "CallableFunction", 'takeCallable', 'a')) {
    youCanAddABreakpointHere();
  }
}
// -----------------------------------------------------------------------------

// Positive calls: no warnings expected

// -----------------------------------------------------------------------------


// -----------------------------------------------------------------------------

// Positive calls: no warnings expected

// -----------------------------------------------------------------------------
takeUnknown(1); // ok: unknown accepts everything

takeVoid(undefined); // ok

takeSymbol(Symbol("s")); // ok

takeBigint(10n); // ok

takeUpper("ABC"); // ok

takeUpperAbc("ABC"); // ok: literal mapping

takeLower("abc"); // ok

takeCapitalized("Foo"); // ok

takeUncapitalized("foo"); // ok

takeRequired({
  a: 1
}); // ok

takeExcluded(1); // ok: only non-string kept

takeAwaited(Promise.resolve(1)); // ok

takeNoInfer(1); // ok

takeStringObject("abc"); // ok: primitives satisfy String

takeDate(new Date("2024-01-02")); // ok

takeCallable(function () {}); // ok

// -----------------------------------------------------------------------------

// Negative calls: each must warn

// -----------------------------------------------------------------------------

 // ok

// -----------------------------------------------------------------------------

// Negative calls: each must warn

// -----------------------------------------------------------------------------
takeNever(1); // warns: nothing validates against never

takeVoid(1); // warns: void only accepts undefined

takeSymbol("s"); // warns: must be symbol

takeBigint(1); // warns: must be bigint

takeUpper("abc"); // warns: not all uppercase

takeUpperAbc("abc"); // warns: must be ABC

takeLower("ABC"); // warns: not all lowercase

takeCapitalized("foo"); // warns: must be Foo

takeUncapitalized("Foo"); // warns: must be foo

takeRequired({}); // warns: a is required

takeRequired({
  a: "x"
}); // warns: a must be number

takeExcluded("a"); // warns: excluded

takeAwaited(1); // warns: must be a Promise

takeNoInfer("x"); // warns: must be number

takeStringObject(1); // warns: must be String

takeDate("2024-01-02"); // warns: must be Date

takeCallable(1); // warns: must be function

