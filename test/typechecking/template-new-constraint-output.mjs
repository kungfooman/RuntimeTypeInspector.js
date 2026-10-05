
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
   */   constructor(constructorFunc, size) {
    const rtiTemplates = {
      "T": {
        "type": "new",
        "parameters": [
          {
            "type": "array",
            "elementType": {
              "type": {
                "type": "array",
                "elementType": "any"
              },
              "name": "args"
            }
          }
        ],
        "ret": "any"
      }
    };
    if (!inspectTypeWithTemplates(constructorFunc, "T", 'Pool#constructor', 'constructorFunc', rtiTemplates)) {
      youCanAddABreakpointHere();
    }
    if (!inspectTypeWithTemplates(size, "number", 'Pool#constructor', 'size', rtiTemplates)) {
      youCanAddABreakpointHere();
    }
    this._constructor = constructorFunc;
    this._size = size;
  }
}
registerClass(Pool);
class ContactPoint {

}
registerClass(ContactPoint);
const pool = new Pool(ContactPoint, 5); // ok

// @ts-expect-error: 42 is no constructor function

 // ok

// @ts-expect-error: 42 is no constructor function
const broken = new Pool(42, 5);
