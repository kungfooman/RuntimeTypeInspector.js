/**
 * Optional template occurrence with a tree constraint: the occurrence flags
 * merge into the constraint shape instead of nesting a tree in the leaf
 * type position. Valid TypeScript throughout (tsc-checked alongside).
 */
/**
 * @template {new (...args: any[]) => any} T
 */
class MaybePool {
    /**
     * @param {T} [constructorFunc] - Optional constructor.
     */
    constructor(constructorFunc) {
        this._c = constructorFunc;
    }
}
class ContactPoint {
}
const absent = new MaybePool(); // ok: optional
const present = new MaybePool(ContactPoint); // ok
// @ts-expect-error: 42 is no constructor
const bad = new MaybePool(42);
