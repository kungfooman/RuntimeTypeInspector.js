/**
 * Template constrained to a construct signature: the constraint expands to
 * a type tree, so a class value validates instead of failing `unchecked`.
 * Valid TypeScript throughout (tsc-checked alongside).
 */
/**
 * @template {new (...args: any[]) => any} T
 */
class Pool {
    /**
     * @param {T} constructorFunc - The constructor function.
     * @param {number} size - The pool size.
     */
    constructor(constructorFunc, size) {
        this._constructor = constructorFunc;
        this._size = size;
    }
}
class ContactPoint {
}
const pool = new Pool(ContactPoint, 5); // ok
// @ts-expect-error: 42 is no constructor function
const broken = new Pool(42, 5);
