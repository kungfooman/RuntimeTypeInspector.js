// -----------------------------------------------------------------------------
// Top and bottom types: unknown accepts everything, never accepts nothing
// -----------------------------------------------------------------------------

/**
 * @param {unknown} a
 */
function takeUnknown(a) {}

/**
 * @param {never} a
 */
function takeNever(a) {}

/**
 * @param {void} a
 */
function takeVoid(a) {}

/**
 * @param {symbol} a
 */
function takeSymbol(a) {}

/**
 * @param {bigint} a
 */
function takeBigint(a) {}

// -----------------------------------------------------------------------------
// Intrinsic string mappings: Uppercase, Lowercase, Capitalize, Uncapitalize
// -----------------------------------------------------------------------------

/**
 * @param {Uppercase<string>} a
 */
function takeUpper(a) {}

/**
 * @param {Uppercase<"abc">} a
 */
function takeUpperAbc(a) {}

/**
 * @param {Lowercase<string>} a
 */
function takeLower(a) {}

/**
 * @param {Capitalize<"foo">} a
 */
function takeCapitalized(a) {}

/**
 * @param {Uncapitalize<"Foo">} a
 */
function takeUncapitalized(a) {}

// -----------------------------------------------------------------------------
// Object and union utilities: Required, Exclude, Awaited, NoInfer
// -----------------------------------------------------------------------------

/**
 * @param {Required<{a?: number}>} opts
 */
function takeRequired(opts) {}

/**
 * @param {Exclude<"a" | "b" | 1, string>} a
 */
function takeExcluded(a) {}

/**
 * @param {Awaited<Promise<number>>} a
 */
function takeAwaited(a) {}

/**
 * @param {NoInfer<number>} a
 */
function takeNoInfer(a) {}

// -----------------------------------------------------------------------------
// Already working: interfaces, builtins, functions
// -----------------------------------------------------------------------------

/**
 * @param {String} a
 */
function takeStringObject(a) {}

/**
 * @param {Date} a
 */
function takeDate(a) {}

/**
 * @param {CallableFunction} a
 */
function takeCallable(a) {}

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
takeRequired({a: 1}); // ok
takeExcluded(1); // ok: only non-string kept
takeAwaited(Promise.resolve(1)); // ok
takeNoInfer(1); // ok
takeStringObject("abc"); // ok: primitives satisfy String
takeDate(new Date("2024-01-02")); // ok
takeCallable(function () {}); // ok

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
takeRequired({a: "x"}); // warns: a must be number
takeExcluded("a"); // warns: excluded
takeAwaited(1); // warns: must be a Promise
takeNoInfer("x"); // warns: must be number
takeStringObject(1); // warns: must be String
takeDate("2024-01-02"); // warns: must be Date
takeCallable(1); // warns: must be function
