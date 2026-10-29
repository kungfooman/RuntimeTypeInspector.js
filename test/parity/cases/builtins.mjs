/**
 * Builtin utility parity: Awaited unwraps promise types, ReturnType
 * resolves declared returns, and the case intrinsics enforce letter case.
 * tsc is the oracle; error counts per case must agree.
 * @param {Awaited<Promise<number>>} x - Unwrapped fulfillment.
 * @returns {void}
 */
function checkAwaitedPromise(x) {
}
/**
 * @param {Awaited<number>} x - Non-promises are their own awaited type.
 * @returns {void}
 */
function checkAwaitedPlain(x) {
}
/**
 * @param {ReturnType<() => string>} x - Declared return.
 * @returns {void}
 */
function checkDeclaredReturn(x) {
}
/**
 * @param {Uppercase<string>} x - Uppercase only.
 * @returns {void}
 */
function checkUppercase(x) {
}
/**
 * @param {Lowercase<string>} x - Lowercase only.
 * @returns {void}
 */
function checkLowercase(x) {
}
/**
 * @param {Capitalize<string>} x - Capitalized only.
 * @returns {void}
 */
function checkCapitalized(x) {
}
/**
 * @param {Uncapitalize<string>} x - Uncapitalized only.
 * @returns {void}
 */
function checkUncapitalized(x) {
}
/**
 * @param {Uppercase<'ab' | 'cd'>} s - Intrinsics distribute over unions.
 * @returns {void}
 */
function checkUnionUppercase(s) {
}
/**
 * @param {ReadonlyMap<string, number>} m - Same shape as Map.
 * @returns {void}
 */
function checkReadonlyMap(m) {
}
/**
 * @param {ReadonlySet<number>} s - Same shape as Set.
 * @returns {void}
 */
function checkReadonlySet(s) {
}
/**
 * @param {Iterable<number>} it - Shape-only: RTI cannot observe yields.
 * @returns {void}
 */
function checkIterable(it) {
}
checkAwaitedPromise(1);
checkAwaitedPromise(Promise.resolve(1));
checkAwaitedPromise(null);
checkAwaitedPlain(1);
checkAwaitedPlain('x');
checkDeclaredReturn('x');
checkDeclaredReturn(1);
checkUppercase('ABC');
checkUppercase('abc');
checkUppercase(1);
checkLowercase('abc');
checkLowercase('ABC');
checkCapitalized('Abc');
checkCapitalized('abc');
checkUncapitalized('aBC');
checkUncapitalized('Abc');
checkUnionUppercase('AB');
checkUnionUppercase('CD');
checkUnionUppercase('ab');
checkReadonlyMap(new Map([['a', 1]]));
checkReadonlyMap(new Map([['a', 'x']]));
checkReadonlyMap({});
checkReadonlySet(new Set([1]));
checkReadonlySet(new Set(['x']));
checkIterable([1, 2]);
checkIterable(new Set([1]));
checkIterable(new Map([['a', 1]])); // parity-diverges: rti-quieter (yielded entries unobservable, shape-only check)
