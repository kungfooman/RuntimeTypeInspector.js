/**
 * Template constrained to an abstract construct signature: abstractness
 * erases at runtime (constructors are still functions), so any constructor
 * validates while non-functions throw. Valid TypeScript throughout
 * (tsc-checked alongside).
 */
/**
 * @template {abstract new (...args: any[]) => any} T
 */
class AbstractPool {
    /**
     * @param {T} constructorFunc - An abstract constructor.
     */
    constructor(constructorFunc) {
        this._c = constructorFunc;
    }
}
class Base {
}
const okAbs = new AbstractPool(Base); // ok
// @ts-expect-error: 42 is no constructor
const badAbs = new AbstractPool(42);
