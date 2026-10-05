/**
 * Template constrained to a union of construct signatures: each member
 * expands, so constructible classes validate and anything else throws.
 * Valid TypeScript throughout (tsc-checked alongside).
 */
/**
 * @template {(new () => Date) | (new () => RegExp)} T
 */
class UnionFactory {
    /**
     * @param {T} make - A zero-arg constructor.
     */
    constructor(make) {
        this._make = make;
    }
    /**
     * @returns {T} The constructor itself.
     */
    getMake() {
        return this._make;
    }
}
const a = new UnionFactory(Date); // ok
// @ts-expect-error: 42 is no constructor
const c = new UnionFactory(42);
