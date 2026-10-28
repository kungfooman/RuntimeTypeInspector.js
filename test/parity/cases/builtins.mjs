/**
 * Builtin utility parity: Awaited unwraps promise types, ReturnType
 * resolves declared returns, and the case intrinsics enforce letter case.
 * tsc is the oracle; error counts per case must agree.
 * @param {Awaited<Promise<number>>} x - Unwrapped fulfillment.
 * @returns {void}
 */
function case01(x) {
}
/**
 * @param {Awaited<number>} x - Non-promises are their own awaited type.
 * @returns {void}
 */
function case02(x) {
}
/**
 * @param {ReturnType<() => string>} x - Declared return.
 * @returns {void}
 */
function case03(x) {
}
/**
 * @param {Uppercase<string>} x - Uppercase only.
 * @returns {void}
 */
function case04(x) {
}
/**
 * @param {Lowercase<string>} x - Lowercase only.
 * @returns {void}
 */
function case05(x) {
}
/**
 * @param {Capitalize<string>} x - Capitalized only.
 * @returns {void}
 */
function case06(x) {
}
/**
 * @param {Uncapitalize<string>} x - Uncapitalized only.
 * @returns {void}
 */
function case07(x) {
}
/**
 * @param {Uppercase<'ab' | 'cd'>} s - Intrinsics distribute over unions.
 * @returns {void}
 */
function case08(s) {
}
/**
 * @param {ReadonlyMap<string, number>} m - Same shape as Map.
 * @returns {void}
 */
function case09(m) {
}
/**
 * @param {ReadonlySet<number>} s - Same shape as Set.
 * @returns {void}
 */
function case10(s) {
}
/**
 * @param {Iterable<number>} it - Shape-only: RTI cannot observe yields.
 * @returns {void}
 */
function case11(it) {
}
case01(1);
case01(Promise.resolve(1));
case01(null);
case02(1);
case02('x');
case03('x');
case03(1);
case04('ABC');
case04('abc');
case04(1);
case05('abc');
case05('ABC');
case06('Abc');
case06('abc');
case07('aBC');
case07('Abc');
case08('AB');
case08('CD');
case08('ab');
case09(new Map([['a', 1]]));
case09(new Map([['a', 'x']]));
case09({});
case10(new Set([1]));
case10(new Set(['x']));
case11([1, 2]);
case11(new Set([1]));
case11(new Map([['a', 1]])); // parity-diverges: rti-quieter (yielded entries unobservable, shape-only check)
